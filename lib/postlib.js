const fs = require('fs');
const csv = require('csvtojson');
const util = require('util');

readFile = util.promisify(fs.readFile);

const datapath = '../data/postlib/';
const fileList = fs.readdirSync(datapath).filter(filename => filename.slice(-3) === 'csv')

module.exports = makeLib

async function makeLib(){
    var pl

    var fileTransferPromise = fileList.map(async filename => {
            var file = await csv().fromFile(datapath + filename)
            return file
        })
    return Promise.all(fileTransferPromise)
            .then(data => {
                pl = data.reduce( (acc, curr) => {
                    return acc.concat(curr)
                }).sort((p1, p2) => p1["Name"].localeCompare(p2["Name"]))
                console.log(pl.slice(1,10)) //Log For Check
                return pl
            })
}