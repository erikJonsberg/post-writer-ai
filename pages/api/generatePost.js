import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { Configuration, OpenAIApi } from "openai";
import clientPromise from "../../lib/mongodb";

export default withApiAuthRequired(async function handler(req, res) {
  const { user } = await getSession(req, res);
  const client = await clientPromise;
  const db = client.db("BlogStandard");
  const userProfile = await db.collection("users").findOne({
    auth0Id: user.sub,
  });

  if (!userProfile?.availableTokens) {
    res.status(403);
    return;
  }

  const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(config);

  const { topic, keywords } = req.body;

  if (!topic || !keywords) {
    res.status(422);
    return;
  }

  if (topic.length > 100 || keywords.length > 100) {
    res.status(422);
    return;
  }

  // const topic = 'Top 10 tips for dog owners';
  // const keywords = 'first-time dog owners, common dog health issues, best dog breeds';

  // Response snippet - OpenAI API using text-davinci-003 model

  // const response = await openai.createCompletion({
  //   model: 'text-davinci-003',
  //   temperature: 0,
  //   max_tokens: 3600,
  //   prompt: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords ${keywords}.
  //   The content should be formatted in SEO-friendly HTML.
  //   The response must also include appropriate HTML title and meta description.
  //   The meta description should be no longer than 160 characters.
  //   The return format must be stringified JSOM in the following format:
  //   {
  //     "postContent": post content here
  //     "title": post title goes here
  //     "metaDescription": post meta description goes here
  //   }`,
  // })
  //console.log('response: ', response);
  //res.status(200).json({ post: JSON.parse(response.data.choices[0]?.text.split("\n").join("")) });
  // }

  // Response snippet - OpenAI API using gpt-3.5-turbo model

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a blog post generator.",
      },
      {
        role: "user",
        content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords ${keywords}.
        The content should be formatted in SEO-friendly HTML that includes appropriate H1 and H2 elements.
        The response must also include appropriate HTML title and meta description.
        The return format must be stringified JSOM in the following format:
        {
          "postContent": post content here
          "title": post title goes here
          "metaDescription": post meta description goes here
        }`,
      },
    ],
    max_tokens: 3600,
    temperature: 0.5,
  });

  //console.log("response: ", response);

  let parsed;

  try {
    // SNIPPET FOR GPT 3.5
    parsed = JSON.parse(
      response.data.choices[0]?.message.content.split("\n").join("")
    );
    // parsed = JSON.parse(response.data.choices[0]?.text.split("\n").join(""));
  } catch (e) {
    res.status(500).json({
      message: "The response could not be parsed into JSON",
      data: response.data.choices[0]?.text,
    });
    return;
  }

  await db.collection("users").updateOne(
    {
      auth0Id: user.sub,
    },
    {
      $inc: {
        availableTokens: -1,
      },
    }
  );

  const post = await db.collection("posts").insertOne({
    postContent: parsed?.postContent,
    title: parsed?.title,
    metaDescription: parsed?.metaDescription,
    topic,
    keywords,
    userId: userProfile._id,
    created: new Date(),
  });

  console.log("post: ", post);

  res.status(200).json({
    postId: post.insertedId,
  });
});
