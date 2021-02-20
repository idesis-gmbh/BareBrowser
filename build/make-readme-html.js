// https://docs.github.com/en/rest/reference/markdown
// https://stackoverflow.com/questions/7694887/is-there-a-command-line-utility-for-rendering-github-flavored-markdown
// jq --slurp --raw-input  '{"text": "\(.)", "mode": "markdown"}' < ./app/_root/README.md | curl -H "Accept: application/vnd.github.v3+json" --data @- https://api.github.com/markdown > ./app/_root/README.txt

const fse = require("fs");
const readme = process.argv[2];
const htmlTemplate = readme.replace(/.md$/, ".html");
if (!fse.existsSync(readme) || !fse.existsSync(htmlTemplate)) {
    return;
}

const placeHolder = "<!-- README.md -->";
const htmlTemplateContent = fse.readFileSync(htmlTemplate).toString();
if (htmlTemplateContent.indexOf(placeHolder) === -1) {
    return;
}

try {
    const { Octokit } = require("@octokit/core");
    
    async function makeReadmeHTML() {
        let githubHTML = await new Octokit({
            // Authentication token (optional).
            // https://github.com/octokit/core.js#authentication
            // auth: "<your token>"
        }).request('POST /markdown', {
            accept: "application/vnd.github.v3+json",
            mode: "markdown",
            text: readmeContent
        });
        // Internal links must be adapted.
        const finalHTML = githubHTML.data.replace(/ href="#/g, " href=\"#user-content-");
        const processedHTML = htmlTemplateContent.replace(placeHolder, finalHTML);
        fse.writeFileSync(htmlTemplate, processedHTML, {encoding: "utf8"});
    }
    
    const readmeContent = fse.readFileSync(readme).toString();
    makeReadmeHTML();
} catch (error) {
    console.error(error);
    process.exit(-1);
}
