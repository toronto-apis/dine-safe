const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ROW_ID - Represents the Row Number
// ESTABLISHMENT_ID – Unique identifier for an establishment
// INSPECTION_ID - Unique identifier for each Inspection
// ESTABLISHMENT_NAME – Business name of the establishment
// ESTABLISHMENTTYPE – Establishment type ie restaurant, mobile cart
// ESTABLISHMENT_ADDRESS – Municipal address of the establishment
// LONG / LAT– Longitude & Latitude coordinates of an establishment
// ESTABLISHMENT_STATUS – Pass, Conditional Pass, Closed
// MINIMUM_INSPECTIONS_PERYEAR – Every eating and drinking establishment in the City of Toronto receives a minimum of 1, 2, or 3 inspections each year depending on the specific type of establishment, the food preparation processes, volume and type of food served and other related criteria
// INFRACTION_DETAILS – Description of the Infraction
// INSPECTION_DATE – Calendar date the inspection was conducted
// SEVERITY – Level of the infraction, i.e.S – Significant, M – Minor, C – Crucial
// ACTION – Enforcement activity based on the infractions noted during a food safety inspection
// COURT_OUTCOME – The registered court decision resulting from the issuance of a ticket or summons for outstanding infractions to the Health Protection and Promotion Act
// AMOUNT_FINED – Fine determined in a court outcome

const inspectionSchema = new Schema({
    inspection_id: Number,
    infraction_details: String,
    inspection_date: String,
    severity: String,
    action: String,
    court_outcome: String,
    amount_fined: String
});

const Inspection = mongoose.model('Inspection', inspectionSchema);

const restaurantSchema = new Schema({
    establishment_id: String,
    establishment_name: String,
    establishment_type: String,
    establishment_address: String,
    establishment_status:    String,
    location: {
        type: {type: "String", default: "Point"},
        coordinates: [Number,Number]
    },
    minimum_inspections_per_year: String,
    inspections: [{ ref: 'Inspection', type: Schema.Types.ObjectId }]
});

restaurantSchema.index({ loc: '2dsphere' });

const Restaurant = mongoose.model('Restaurant',restaurantSchema);


module.exports = { Restaurant, Inspection };