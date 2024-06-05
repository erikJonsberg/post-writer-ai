import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { AppLayout } from "../../components/AppLayout";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getAppProps } from "../../utils/getAppProps";
import { useContext, useState } from "react";
import { useRouter } from "next/router";
import PostsContext from "../../context/postsContext";
import { HashtagIcon } from "@heroicons/react/24/outline";

export default function Post(props) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deletePost } = useContext(PostsContext);

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch("/api/deletePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: props.id }),
      });
      const json = await response.json();
      if (json.success) {
        deletePost(props.id);
        router.replace("/post/new");
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-screen-sm">
        <div className="mt-6 rounded-sm bg-stone-400 p-2 text-sm font-bold">
          SEO title and meta description
        </div>
        <div className="my-2 rounded-md border border-stone-200 p-4 ">
          <div className="text-2xl font-bold text-blue-600">{props.title}</div>
          <div className="mt-2">{props.metaDescription}</div>
        </div>
        <div className="mt-6 rounded-sm bg-stone-400 p-2 text-sm font-bold">
          Keywords
        </div>
        <div className="flex flex-wrap gap-1 p-2">
          {props.keywords.split(",").map((keyword, i) => (
            <div
              key={i}
              className="rounded-full bg-slate-800 p-2 text-sm text-white"
            >
              <HashtagIcon /> {keyword}
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-sm bg-stone-400 p-2 text-sm font-bold">
          Blog Post
        </div>
        <div dangerouslySetInnerHTML={{ __html: props.postContent || "" }} />
        <div className="my-4">
          {!showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-600 hover:bg-red-700"
            >
              Delete Post
            </button>
          )}
          {!!showDeleteConfirm && (
            <div>
              <p className="bg-red-300 p-2 text-center">
                Are you sure you want to delete this post? This action is
                irreversible.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn bg-stone-600 hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn bg-red-600 hover:bg-red-700"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Post.getLayout = (page, pageProps) => {
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const props = await getAppProps(ctx);
    const userSession = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = client.db("BlogStandard");
    const user = await db.collection("users").findOne({
      auth0Id: userSession.user.sub,
    });
    const post = await db.collection("posts").findOne({
      _id: new ObjectId(ctx.params.postId),
      userId: user._id,
    });

    if (!post) {
      return {
        redirect: {
          destination: "/post/new",
          permanent: false,
        },
      };
    }
    return {
      props: {
        id: ctx.params.postId,
        postContent: post.postContent,
        title: post.title,
        metaDescription: post.metaDescription,
        keywords: post.keywords,
        postCreated: post.created.toString(),
        ...props,
      },
    };
  },
});
