const express = require('express');
const app = express();
const models = require('./models');

function getCount(query,model) {
    return new Promise((res,rej) =>{
        models[model].count(query,(...args) => res(args));
    });
}

app.get('/restaurants',(req,res) =>{
    const per_page = Number(req.query.per_page > 30 ? 30 : req.query.per_page) || 30;
    const offset = Number(req.query.offset) || 0;
    const inspections = req.query.inspections || false;
    const query = {};
    models.Restaurant
        .find({}, async (err,docs) => {
            if(err) {
                res.status(400)
                    .send({
                        error: err
                    });
                return;
            }
            const [_, count] = await getCount(query,'Restaurant');
            res.status(200)
                .send({
                    restaurants: docs,
                    count
                });
        })
        .populate(inspections === 'true' ? 'inspections' : '')
        .limit(per_page)
        .skip(offset)
});

app.get('/restaurants/:id',(req,res) => {
    const { id } = req.params;
    models.Restaurant.findOne({ establishment_id: id },(err,doc) => {
        if(err) {
            res.status(400)
                .send({
                    error: err
                });
            return;
        }

        res.status(200)
            .send({
                restaurant: doc
            });
    })
    .populate('inspections');
});

app.get('/restaurants/:id/inspections', (req,res) => {
    const { id } = req.params;
    models.Restaurant.findOne({ establishment_id: id }, (err,doc) => {
        if(err) {
            res.status(400)
                .send({
                    error: err
                });
            return;
        }
        res.status(200)
            .send({
                inspections: doc.inspections
            });
    })
    .populate('inspections');


});

app.listen(process.env.PORT || '3700');