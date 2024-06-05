import Image from "next/image";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Logo } from "../Logo/Logo";
import { useContext, useEffect } from "react";
import PostsContext from "../../context/postsContext";
import { TicketIcon } from "@heroicons/react/24/outline";

export const AppLayout = ({
  children,
  availableTokens,
  posts: postsFromSSR,
  postId,
  postCreated,
}) => {
  const { user } = useUser();

  const { setPostsFromSSR, posts, getPosts, noMorePosts } =
    useContext(PostsContext);

  useEffect(() => {
    setPostsFromSSR(postsFromSSR);
    if (postId) {
      const exists = postsFromSSR.find((post) => post.id === postId);
      if (!exists) {
        getPosts({ getNewerPosts: true, lastPostDate: postCreated });
      }
    }
  }, [getPosts, postCreated, postId, postsFromSSR, setPostsFromSSR]);

  return (
    <div className="grid h-screen max-h-screen grid-cols-[300px_1fr]">
      <div className="flex flex-col overflow-hidden text-white">
        <div className="bg-slate-800 px-2">
          <Logo />
          <Link className="btn" href="/post/new">
            New Post
          </Link>
          <Link className="mt-2 block text-center" href="/token-topup">
            <TicketIcon className="text-yellow-500" />
            <span className="pl-1">{availableTokens} tokens available</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto bg-gradient-to-b from-slate-800 to-cyan-800 px-4">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/post/${post._id}`}
              className={`test-ellipsis my-1 block cursor-pointer overflow-hidden whitespace-nowrap rounded-sm border border-white/0 bg-white/10 px-2 py-2 ${
                postId === post._id ? "border-white bg-white/20" : ""
              }`}
            >
              {post.topic}
            </Link>
          ))}
          {!noMorePosts && (
            <div
              onClick={() => {
                getPosts({ lastPostDate: posts[posts.length - 1].created });
              }}
              className="mt-4 cursor-pointer text-center text-sm text-slate-400 hover:underline"
            >
              Load more posts
            </div>
          )}
        </div>
        <div className="flex h-20 items-center gap-2 border-t border-black/50 bg-cyan-800 px-2">
          {user ? (
            <>
              <div className="min-w-[50px]">
                <Image
                  className="rounded-full"
                  src={user.picture}
                  alt={user.name}
                  width={50}
                  height={50}
                  as="img"
                  priority
                />
              </div>
              <div className="flex-1">
                <div className="font-bold">{user.email}</div>
                <Link className="text-sm" href="/api/auth/logout">
                  Logout
                </Link>
              </div>
            </>
          ) : (
            <Link href="/api/auth/login">Login</Link>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
