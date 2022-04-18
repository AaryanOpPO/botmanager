var fs = require('fs'); var cp = require('child_process'); var files = fs.readdirSync("./");
(async() => {
    for(const file of files) {
        const srcDir = `${process.cwd()}/toupdate/`;
        const destDir = `${process.cwd()}/"${file}"/`;
        if(!fs.lstatSync(`./${file}`).isDirectory()) { console.log(destDir + " | Not a Folder, continue"); continue; }
        if(destDir.includes("toupdate")) { console.log(destDir + " | update folder, continue"); continue; }
        await new Promise((res)=>setTimeout(()=>res(2),1000))
        cp.exec(`rsync -r ${srcDir} ${destDir}`, {maxBuffer: 1024 * 500 * 1024}, (err, stdout, stderr) => {
            if (err) return console.error(err);
            if(stderr) console.log(stderr)
            console.log( "FINISHED: "+ destDir)
            cp.exec(`rsync -r ${srcDir} ${destDir}`, {maxBuffer: 1024 * 500 * 1024}, (err, stdout, stderr) => {
                if (err) return console.error(err);
                if(stderr) console.log(stderr)
                console.log( "FINISHED-2-SECURE-COPY: "+ destDir)
            });
        });
    }
})();