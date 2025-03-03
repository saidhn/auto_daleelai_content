const fs = require("fs");
const path = require("path");
const url = require('url');

require("dotenv").config();
const https = require("https");
const querystring = require("querystring");

const apiUrl =
  "https://daleelai.com/wp-content/themes/DaleelAI/publish_api.php";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//logo url https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://poe.com&size=256
//logo url2 https://logo.clearbit.com/https://poe.com
//------------------------- functions --------------------------------
async function appendNewToolsToFile(toolsString, filePath = "ai_tools.txt") {
  try {
    const aiTools = toolsString.split(",");
    const absoluteFilePath = path.resolve(filePath);

    // Check if the file exists and read its content
    let existingTools = [];
    if (fs.existsSync(absoluteFilePath)) {
      const fileContent = fs.readFileSync(absoluteFilePath, "utf8");
      existingTools = fileContent.split(",").map((tool) => tool.trim()); // Trim whitespace
    }

    // Filter out tools that are already in the file
    const newTools = aiTools.filter(
      (tool) => !existingTools.includes(tool.trim())
    ); // Trim whitespace

    if (newTools.length > 0) {
      // Append the new tools to the file
      fs.appendFileSync(
        absoluteFilePath,
        (existingTools.length > 0 ? "," : "") +
          newTools.map((tool) => tool.trim()).join(","),
        "utf8"
      ); // Trim whitespace

      console.log(
        `Appended ${newTools.length} new tools to ${absoluteFilePath}`
      );
    } else {
      console.log("No new tools to append.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
async function readToolsFromFile(filePath = "ai_tools.txt") {
  try {
    const absoluteFilePath = path.resolve(filePath);

    if (fs.existsSync(absoluteFilePath)) {
      const fileContent = fs.readFileSync(absoluteFilePath, "utf8");
      const tools = fileContent.split(",").map((tool) => tool.trim());
      return tools;
    } else {
      console.log(`File not found: ${absoluteFilePath}`);
      return []; // Return an empty array if the file doesn't exist
    }
  } catch (error) {
    console.error("Error reading file:", error);
    return []; // Return an empty array in case of an error
  }
}
function getUniqueNamesCommaSeparated(namesString) {
  if (!namesString) {
    return "";
  }

  const namesArray = namesString.split(",").map((name) => name.trim());
  const uniqueNames = [...new Set(namesArray)];
  return uniqueNames.join(", ");
}

async function get_titles(apiUrl) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      apikey: process.env.WEB_KEY,
      action: "get_titles",
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        // console.log("Raw API Response:", data); // Added for debugging
        try {
          //   const jsonData = JSON.parse(data);
          //   resolve(jsonData);
          
          resolve(getUniqueNamesCommaSeparated(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}
async function getWebsiteCategories(apiUrl) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      apikey: process.env.WEB_KEY,
      action: "get_categories",
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        // console.log("Raw API Response:", data); // Added for debugging
        try {
          //   const jsonData = JSON.parse(data);
          //   resolve(jsonData);

          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}
async function publish_post(apiUrl, publishData) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      apikey: process.env.WEB_KEY,
      action: "publish",
      title: publishData.title,
      body: publishData.body,
      cats: publishData.cats,
      website: publishData.website,
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("Raw API Response:", data); // Added for debugging
        try {
          //   const jsonData = JSON.parse(data);
          //   resolve(jsonData);

          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}
function isValidWebsite(website) {
  try {
    const parsedUrl = new url.URL(website);

    // Basic checks: protocol and hostname
    if (!parsedUrl.protocol || !parsedUrl.hostname) {
      return false;
    }

    // Optional: Check for specific protocols (e.g., http, https)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    return true; // It's a valid URL
  } catch (error) {
    return false; // Invalid URL format
  }
}
async function refreshAiTools(){ 
  const titles = await get_titles(apiUrl);
  let prompt = "give me a list of new Artificial Intelligence tools (output only the new list comma separated) the tools should NOT be one of this: " + titles + " don't output anything else.";
  let geminiResult = await model.generateContent([prompt]);

  const results = geminiResult = geminiResult.response.text();

  aiTools = results.trim();
  //console.log(results);
}

//------------------------- main --------------------------------
let ai_tools = "";
(async () => {

  await refreshAiTools();

  const doneTools = await readToolsFromFile();

  const tools = aiTools.split(",").map((tool) => tool.trim());
  console.log("new ai tools: " + tools.length);

  try {
    const categories = await getWebsiteCategories(apiUrl);
    // Process the API data here

    for (const tool of tools) {
        
        if(doneTools.indexOf(tool) !== -1) {
            continue;
        }
        console.log("Processing tool: " + tool);

      const prompt =
        "Create me a full blog in Arabic to review the AI tool '" +
        tool +
        "' also write the ids of relevant categories to " +
        tool +
        " from this json categories " +
        categories +
        "\noutput only the blog body (no title, don't say blog about) should be HTML format and SEO friendly starting from inside <body> tag don't include the body tag itself then ids of relevant categories comma separated (row ids only), finally the full '" +
        tool +
        "' website url (raw website url only)";
      try {
        let geminiResult = await model.generateContent([prompt]);
        geminiResult = geminiResult.response.text().replace("```html", "");
        const parts = geminiResult.split("```\n");
        const blogBody = parts[0].trim();
        const parts2 = parts[1].split("\n\n");
        const cats = parts2[0].trim().replace(" ", "");
        const website = parts2[1].trim();
        if(!isValidWebsite(website)){
          continue;
        }
        console.log( cats, website);
        const publish_results =JSON.parse( await publish_post(apiUrl, {
          body: blogBody,
          title: tool,
          cats: cats,
          website: website,
        }));
        if (publish_results.status == "success") {
          await appendNewToolsToFile(tool);
        } else {
          console.error("Failed to publish post for " + tool);
        }
      } catch (err) {
        console.error("Error generating content:", err);
      }
      //process.exit(0);
    }
  } catch (error) {
    console.error("Error fetching API data:", error);
  }

  console.log("exiting");
  //process.exit(0); //Remove this line until debugging is finished
})();
