const utils = require('./utils');
const models = require('./models');

mongoose.connect('mongodb://localhost/dinesafe');

function importData() {
    //Need to fix this to check for resta urants is they already exist
    //and only add new ones/new inspections
    const previous_inspection_count = models.Inspection.count();
    const previous_restaurant_count = models.Restaurant.count();
    utils
        .downloadFile('http://opendata.toronto.ca/public.health/dinesafe/dinesafe.zip')
        .then(utils.unzipFile)
        .then(utils.readXML)
        .then(utils.importData)
        .then(() => {
            console.log(new Date(),'Done');
            const current_inspection_count = models.Inspection.count();
            const current_restaurant_count = models.Restaurant.count();
            const info = new models.Info({
                date: new Date(),
                current_restaurant_count,
                previous_restaurant_count,
                current_inspection_count,
                previous_inspection_count
            });
            info.save(() => {
                process.exit(0);
            });
        })
        .catch((err) => console.log(err));
}

importData();