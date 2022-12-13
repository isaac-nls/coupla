const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
  });
const openai = new OpenAIApi(configuration);

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let data = {
        model: "text-davinci-003",
        temperature: 0.75,
        max_tokens: 530,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        // stop: ["###"]
        // n: 2,
        // best_of: 2
    }
    data = Object.assign(data, req.body)
    console.log("sending", data)
    const completion = await openai.createCompletion(data);
    // console.log(completion.data.choices)
    // res.send(completion.data.choices[0].text);

    // const name = (req.query.name || (req.body && req.body.name));
    // const responseMessage = name
    //     ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    //     : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: completion.data.choices[0].text // responseMessage
    };
}