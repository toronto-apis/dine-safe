const utils = require('./utils');

function importData() {
    //Need to fix this to check for resta urants is they already exist
    //and only add new ones/new inspections
    utils
        .downloadFile('http://opendata.toronto.ca/public.health/dinesafe/dinesafe.zip')
        .then(utils.unzipFile)
        .then(utils.readXML)
        .then(utils.importData)
        .then(() => {
            console.log(new Date(),'Done');
            process.exit(0);
        })
        .catch((err) => console.log(err));
}

importData();