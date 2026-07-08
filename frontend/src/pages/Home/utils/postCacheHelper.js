export const incrementPostCommentCount = (queryClient, postId, delta = 1) => {
  queryClient.setQueriesData({ queryKey: ["posts"] }, (prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      pages: prev.pages.map((page) => ({
        ...page,
        posts: page.posts.map((p) =>
          p.id === postId
            ? { ...p, comments_count: (p.comments_count ?? 0) + delta }
            : p
        ),
      })),
    };
  });
};