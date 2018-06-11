const utils = {};
const fs = require('fs');
const request = require('request');
const unzip = require('unzip');
const XMLparser = require('xml2json');
const mongoose = require('mongoose');
const models = require('./models');

mongoose.connect('mongodb://localhost/dinesafe');

function isEmptyObject(obj) {
    if(obj === null || obj === undefined) {
        return true;
    }
    return Object.keys(obj).length === 0 && obj.constructor === Object
}

function restaurantExists(id) {
    return new Promise((res,rej) => {
        models.Restaurant.findOne({establishment_id:id},(err,doc) => {
            if(err || doc === null) {
                res([err,false]);
            }
            res([null,true]);
        });
    });
}
function inspectionExists(id) {
    return new Promise((res, rej) => {
        models.Inspection.findOne({ inspection_id: id }, (err, doc) => {
            if (err || doc === null) {
                res([err, false]);
            }
            res([null, true]);
        });
    });
}


utils.downloadFile = (fileURL) => {
    console.log('Starting Download');
    return new Promise((res,rej) => {
        const splitPath = fileURL.split('/');
        const fileName = splitPath[splitPath.length - 1];
        //Check if tmp folder exists
        if(fs.existsSync('./tmp') === false ){
            //If not create it
            fs.mkdirSync('./tmp');
        }
        const tempStream = fs.createWriteStream(`./tmp/${fileName}`)
        request.get(fileURL)
            .on('end', () => res(fileName))
            .on('error', rej)
            .pipe(tempStream);
    });
};

utils.unzipFile = (fileName) => {
    console.log('Unzipping File');
    return new Promise((res,rej) => {
        fs.createReadStream(`./tmp/${fileName}`)
            .on('end', () => res(fileName))
            .on('error', rej)
            .pipe(unzip.Extract({
                path: `./tmp/${fileName.replace('.zip','')}`
            }));
    });
};

utils.readXML = (fileName) => {
    console.log("Reading XML");
    return new Promise((res,rej) => {
        const file = fileName.replace('.zip','');
        const XMLdata = fs.readFileSync(`./tmp/${file}/${file}.xml`)

        const json = JSON.parse(XMLparser.toJson(XMLdata));
        res(json.ROWDATA.ROW);
    });
};

utils.importRestaurants = (restaurants) => {
    console.log('Importing Restaurants');
    return Object.keys(restaurants)
        .map(key => restaurants[key])
        .reduce((p,curr) => {
            return p.then(() => {
                return new Promise(async (res,rej) => {
                    const [err,exists] = await restaurantExists(curr.establishment_id);

                    if(err || exists) {
                        res();
                        return;
                    }

                    const restaurant = new models.Restaurant(curr);
                    restaurant.save((err) => {
                        if (err) rej(err);
                        res()
                    });
                });
            });
    }, Promise.resolve())
};

utils.importInspections = (inspections) => {
    console.log("Importing Inspections");
    return Object.keys(inspections)
        .map(key => ({ id: key, inspections: inspections[key] }))
        .reduce((p,curr) => {
            return p.then(() => {
                //curr.inspection is an array
                return Promise.all(
                    curr.inspections
                    .filter(async (inspection) => {
                        const [err,exists] = await inspectionExists(inspection.inspection_id);
                        return exists === false;
                    })
                    .map(inspection => new models.Inspection(inspection))
                    .map(inspection => new Promise((res,rej) => {
                        inspection.save((err,savedInspection) => {
                            if(err) rej(err);
                            models.Restaurant.findOneAndUpdate({
                                establishment_id: curr.id
                            },
                            {
                                $push: { inspections: savedInspection._id }
                            },(err) => {
                                if(err) rej(err);
                                res();
                            });
                        });
                    })));
            });
        }, Promise.resolve())
};

utils.importData = (dinesafeData) => {
    const inspections = dinesafeData.reduce((acc,curr) => {
        const ID = curr.ESTABLISHMENT_ID;
        if (acc[ID] === undefined) {
            acc[ID] = []
        }
        acc[ID].push({
            inspection_id: curr.INSPECTION_ID,
            infraction_details: isEmptyObject(curr.INFRACTION_DETAILS) ? '' : curr.INFRACTION_DETAILS,
            inspection_date: curr.INSPECTION_DATE,
            severity: isEmptyObject(curr.SEVERITY) ? '' : curr.SEVERITY,
            action: isEmptyObject(curr.ACTION) ? '' : curr.ACTION,
            court_outcome: isEmptyObject(curr.COURT_OUTCOME) ? '' : curr.COURT_OUTCOME,
            amount_fined: isEmptyObject(curr.AMOUNT_FINED) ? '' : curr.AMOUNT_FINED
        });
        return acc;
    },{});

    const restaurants = dinesafeData.reduce((acc,curr) => {
        const ID = curr.ESTABLISHMENT_ID;
        if(acc[ID]) {
            return acc;
        }
        acc[ID] = {
            establishment_id: ID,
            establishment_name: curr.ESTABLISHMENT_NAME,
            establishment_type: curr.ESTABLISHMENTTYPE,
            establishment_address: curr.ESTABLISHMENT_ADDRESS,
            establishment_status: curr.ESTABLISHMENT_STATUS,
            location: {
                type: "Point",
                coordinates: [curr.LONGITUDE, curr.LATITUDE]
            },
            minimum_inspections_per_year: curr.MINIMUM_INSPECTIONS_PERYEAR,
        }
        return acc;
    },{});

    return utils.importRestaurants(restaurants)
        .then(() => utils.importInspections(inspections));
};


module.exports = utils;