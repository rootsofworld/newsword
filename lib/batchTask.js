/**
 * @param {Function} task
 * @param {Array} target 
 * @param {Number} batchSize 
 */

function batchTask(task, target, batchSize){
    var self = this
    //////////private method/////////
    function sliceToPieces(arr, size){
        var result = []
        var startIndex = 0
        var remain = arr.length
        while(remain > 0){
            result.push(arr.slice( startIndex, startIndex+size ));
            startIndex = startIndex + size;
            remain = remain - size;
        }
        return result;
    }

    function getPiece(){
        if(self.queue.length === 0) return false;
        return self.queue.shift()
    }
    //////////private method/////////

    this.queue = sliceToPieces(target, batchSize);

    this.work = async function(){
        var result = [];
        var piece = getPiece();
        var pieceDone;
        while(piece){
            //console.log('Q length: ' + this.queue.length)
            await sleep(2000)
            pieceDone = await Promise.all(task(piece))
            result = result.concat(pieceDone)
            console.log('\n' + result.length + '\n')
            piece = getPiece()
        }
        return result
    };

    this.testOne = function(){
        var data = getPiece()
        var result;
        if(data){
            result = task(data)
            console.log(result)
            return result;
        }else{
            console.log('Queue is Empty')
            return false
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = batchTask