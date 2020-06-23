const { parse } = require("url");

module.exports = class Router {
    constructor() {
        this.routes = [];
    }
    add(method, url, handler) {
        this.routes.push({method, url, handler});
    }
    resolve(context, request) {
        let path = parse(request.url).pathname;

        for (let {method, url, handler} of this.routes) {
            let match = url.exec(path);
            if (!match || request.method != method) continue;
            let urlParts = match.slice(1).map(decodeURIComponent);
            return handler(context, ...urlParts, request);
        }    
        return null;
    }
}

const talkPath = /^\/talks\/([^\/]+)$/;

router.add("GET", talkPath, async (server, title) => {
    if (title in server.talks) {
        return {body: JSON.stringify(server.talks[title]),
        headers: {"Content-Type": "application/json"}};
    } else {
        return {status: 404, body: `No talk '${title}' found`};
    }
});

router.add("DELETE", talkPath, async (server, title) => {
    if (title in server.talks) {
        delete server.talks[title];
        server.updated();
    }
    return {status: 204};
});

function readStream(stream) {
        return new Promise((resolve, reject) => {
            let data = "";
            stream.on("error", reject);
            stream.on("data", chunk => data += chunk.toString());
            stream.on("end", () => resolve(data));
        });
    }
    
router.add("PUT", talkPath,
    async (server, title, request) => {
        let requestBody = await readStream(request);
        let talk;
        try { talk = JSON.parse(requestBody); }
        catch (_) { return {status: 400, body: "Invalid JSON"}; }
        377
        if (!talk ||
            typeof talk.presenter != "string" ||
            typeof talk.summary != "string") {
            return {status: 400, body: "Bad talk data"};
        }
        server.talks[title] = {title,
                                presenter: talk.presenter,
                                summary: talk.summary,
                                comments: []};
        server.updated();
        return {status: 204};
    });
    
