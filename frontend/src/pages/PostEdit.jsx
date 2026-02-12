import { useParams } from "react-router-dom";

const PostEdit = () => {
  const { id } = useParams();

  return (
    <div>
      <h1>Détail du post</h1>
      <p>Post ID : {id}</p>
    </div>
  );
};

export default PostEdit;
