import test from './post.js';

function app(){
    console.log('I am main ha');
    fetch('/data')
        .then(data => console.log(data))
}

window.app = app
app()

