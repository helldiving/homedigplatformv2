import { Avatar } from "@chakra-ui/avatar";
import { Image } from "@chakra-ui/image";
import { Box, Flex, Text } from "@chakra-ui/layout";
import { Link, useNavigate } from "react-router-dom";
import Actions from "./Actions";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import userAtom from "../atoms/userAtom";
import { DeleteIcon } from "@chakra-ui/icons";
import { useRecoilState, useRecoilValue } from "recoil";
import postsAtom from "../atoms/postsAtom";

const Post = ({ post, postedBy }) => {
  const currentUser = useRecoilValue(userAtom);
  const [user, setUser] = useState(null);
  const showToast = useShowToast();
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      if (!postedBy) {
        console.error("postedBy is undefined");
        return;
      }
      try {
        if (typeof postedBy === "object" && postedBy._id) {
          setUser(postedBy);
        } else {
          const userId = typeof postedBy === "string" ? postedBy : postedBy._id;
          const res = await fetch(`/api/users/profile/${userId}`);
          const data = await res.json();
          if (data.error) {
            console.error("Error fetching user:", data.error);
          } else {
            setUser(data);
          }
        }
      } catch (error) {
        console.error("Error in getUser:", error);
      }
    };

    getUser();
  }, [postedBy]);

  if (!post || !postedBy) {
    console.log("Post or postedBy is null:", { post, postedBy });
    return null;
  }

  if (!user) {
    console.log("User is null, post:", post);
    return null;
  }

  const replies = post.replies || [];

  const isTagged =
    post.taggedUsers &&
    post.taggedUsers.some((user) => user._id === currentUser._id);

  /* // before: home feed from following only
const Post = ({ post, postedBy }) => {
  const [user, setUser] = useState(null);
  const showToast = useShowToast();
  const currentUser = useRecoilValue(userAtom);
  const [posts, setPosts] = useRecoilState(postsAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch("/api/users/profile/" + postedBy);
        const data = await res.json();

        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setUser(data);
      } catch (error) {
        showToast("Error", error.message, "error");
        setUser(null); // in case if errors
      }
    };

    getUser();
  }, [postedBy, showToast]);
*/

  // Handle deleting a post
  const handleDeletePost = async (e) => {
    try {
      e.preventDefault();
      if (!window.confirm("Are you sure you want to delete this post?")) return;

      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      showToast("Success", "Post deleted", "success");
      setPosts(posts.filter((p) => p._id !== post._id));
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  if (!user) return null;
  return (
    <Link to={`/${user.username}/post/${post._id}`}>
      <Flex gap={3} mb={4} py={5}>
        {/* Render user avatar and reply avatars */}
        <Flex flexDirection={"column"} alignItems={"center"}>
          <Avatar
            size="md"
            name={user.name}
            src={user?.profilePic}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/${user.username}`);
            }}
          />
          <Box w="1px" h={"full"} bg="gray.light" my={2}></Box>
          <Box position={"relative"} w={"full"}>
            {post.replies.length === 0 && <Text textAlign={"center"}>🗨️</Text>}
            {post.replies[0] && (
              <Avatar
                size="xs"
                name="Reply"
                src={post.replies[0].userProfilePic}
                position={"absolute"}
                top={"0px"}
                left="15px"
                padding={"2px"}
              />
            )}
            {post.replies[1] && (
              <Avatar
                size="xs"
                name="Reply"
                src={post.replies[1].userProfilePic}
                position={"absolute"}
                bottom={"0px"}
                right="-5px"
                padding={"2px"}
              />
            )}

            {post.replies[2] && (
              <Avatar
                size="xs"
                name="Reply"
                src={post.replies[2].userProfilePic}
                position={"absolute"}
                bottom={"0px"}
                left="4px"
                padding={"2px"}
              />
            )}
          </Box>
        </Flex>
        <Flex flex={1} flexDirection={"column"} gap={2}>
          <Flex justifyContent={"space-between"} w={"full"}>
            <Flex w={"full"} alignItems={"center"}>
              {/* Render username */}
              <Text
                fontSize={"sm"}
                fontWeight={"bold"}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${user.username}`);
                }}
              >
                {user?.username}
              </Text>
              {/* Render verified badge */}
              <Image src="/verified.png" w={4} h={4} ml={1} />
            </Flex>
            <Flex gap={4} alignItems={"center"}>
              {/* Render post creation time */}
              <Text
                fontSize={"xs"}
                width={36}
                textAlign={"right"}
                color={"gray.light"}
              >
                {formatDistanceToNow(new Date(post.createdAt))} ago
              </Text>
              {/* Render delete icon if the current user is the post owner */}
              {currentUser?._id === user._id && (
                <DeleteIcon size={20} onClick={handleDeletePost} />
              )}
            </Flex>
          </Flex>

          {/* Add the tagged indicator here */}
          {isTagged && (
            <Text fontSize="xs" color="blue.500" fontWeight="bold">
              You were tagged in this post
            </Text>
          )}
          {isTagged && post.postedBy._id !== currentUser._id && (
            <Text fontSize="xs" color="gray.500">
              Tagged by @{post.postedBy.username}
            </Text>
          )}

          {/* Render post text */}
          <Text fontSize={"sm"}>{post.text}</Text>
          {/* Render post image */}
          {post.img && (
            <Box
              borderRadius={6}
              overflow={"hidden"}
              border={"1px solid"}
              borderColor={"gray.light"}
            >
              <Image src={post.img} w={"full"} />
            </Box>
          )}

          {/* Render post actions */}
          <Flex gap={3} my={1}>
            <Actions post={post} />
          </Flex>
        </Flex>
      </Flex>
    </Link>
  );
};

export default Post;
