const {createServer} = require("http");
const Router = require("./router");
const ecstatic = require("ecstatic");

const router = new Router();
const defaultHeaders = {"Content-Type": "text/plain"};

class SkillShareServer {
    constructor(talks) {
        this.talks = talks;
        this.version = 0;
        this.waiting = [];

        let fileServer = ecstatic({root: "./public"});
        this.server = createServer((request, response) => {
            let resolved = router.resolve(this, request);
            if (resolved) {
                resolved.catch(error => {
                    if (error.status != null) return error;
                    return {body: String(error), status: 500};
                }).then(({body,
                            status = 200,
                            headers = defaultHeaders}) => {
                            response.writeHead(status, headers);
                            response.end(body);
                });
            } else {
                fileServer(request, response);
            }
        });
    }
    start(port) {
        this.server.listen(port);
    }
    stop() {
        this.server.close();
    }
}

SkillShareServer.prototype.talkResponse = function() {
    let talks = [];
    for (let title of Object.keys(this.talks)) {
        talks.push(this.talks[title]);
    }
    return {
        body: JSON.stringify(talks),
        headers: {"Content-Type": "application/json",
        "ETag": `"${this.version}"`}
    };
};

router.add("GET", /^\/talks$/, async (server, request) => {
    let tag = /"(.*)"/.exec(request.headers["if-none-match"]);
    let wait = /\bwait=(\d+)/.exec(request.headers["prefer"]);
    if (!tag || tag[1] != server.version) {
        return server.talkResponse();
    } else if (!wait) {
        return {status: 304};
    } else {
        return server.waitForChanges(Number(wait[1]));
    }
});
    
SkillShareServer.prototype.waitForChanges = function(time) {
    return new Promise(resolve => {
        this.waiting.push(resolve);
        setTimeout(() => {
            if (!this.waiting.includes(resolve)) return;
            this.waiting = this.waiting.filter(r => r != resolve);
            resolve({status: 304});
        }, time * 1000);
    });
    };
    
SkillShareServer.prototype.updated = function() {
    this.version++;
    let response = this.talkResponse();
    this.waiting.forEach(resolve => resolve(response));
    this.waiting = [];
};

new SkillShareServer(Object.create(null)).start(8000);