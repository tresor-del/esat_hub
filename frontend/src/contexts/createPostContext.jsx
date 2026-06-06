import { createContext, useContext, useState } from "react";

const CreatePostContext = createContext(null);

export const CreatePostProvider = ({ children }) => {
    const [createPostModale, setCreatePostModale] = useState(false);

    const openCreatePost = () => setCreatePostModale(true);
    const closeCreatePost = () => setCreatePostModale(false);

    return (
        <CreatePostContext.Provider value={{ createPostModale, openCreatePost, closeCreatePost }}>
            {children}
        </CreatePostContext.Provider>
    );
};

export const useCreatePostModal = () => useContext(CreatePostContext);