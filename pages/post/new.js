import { useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { AppLayout } from "../../components/AppLayout";
import { useRouter } from "next/router";
import { getAppProps } from "../../utils/getAppProps";
import { CpuChipIcon } from "@heroicons/react/24/outline";

export default function NewPost(props) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleSumit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await fetch(`/api/generatePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          keywords,
        }),
      });
      const json = await response.json();
      console.log("RESULT: ", json);
      if (json?.postId) {
        router.push(`/post/${json.postId}`);
      }
    } catch (error) {
      setGenerating(false);
      console.error(error);
    }
  };
  return (
    <div className="h-full overflow-hidden">
      {!!generating && (
        <div className="flex h-full w-full animate-pulse flex-col items-center justify-center text-green-500">
          <CpuChipIcon className="text-8xl" />
          <h6>Generating...</h6>
        </div>
      )}
      {!generating && (
        <div className="flex h-full w-full flex-col overflow-auto">
          <form onSubmit={handleSumit} className="card">
            <div>
              <label>
                <strong>Generate a blog post about:</strong>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="my-2 block w-full resize-none rounded-sm border border-slate-500 px-4 py-2"
                maxLength={100}
              />
            </div>
            <div>
              <label>
                <strong>Targeting the following keywords:</strong>
              </label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="my-2 block w-full resize-none rounded-sm border border-slate-500 px-4 py-2"
                maxLength={100}
              />
            </div>
            <small className="mb-2 block">
              Separate keywords with a comma. For example: keyword1, keyword2
            </small>
            <button
              className="btn"
              type="submit"
              disabled={!topic.trim() || !keywords.trim()}
            >
              Generate
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

NewPost.getLayout = (page, pageProps) => {
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const props = await getAppProps(ctx);

    if (!props.availableTokens) {
      return {
        redirect: {
          destination: "/token-topup",
          permanent: false,
        },
      };
    }
    return {
      props,
    };
  },
});
