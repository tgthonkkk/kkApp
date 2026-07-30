import { useState } from "react";
import axios from "axios";

function App() {

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);


  const search = async () => {

    console.log("검색 버튼 클릭:", keyword);

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/search`,
      {
        keyword: keyword
      }
    );

     console.log(response.data);

    setResults(response.data);
  };


  return (
    <div>

      <h1>
        AI 게시물 추천 검색
      </h1>


      <input
        value={keyword}
        onChange={(e)=>setKeyword(e.target.value)}
        placeholder="검색어 입력"
      />


      <button onClick={search}>
        검색
      </button>


      <h2>
        추천 결과
      </h2>


      {
        results.map((post, index)=>(
          <div key={index}>

            <h3>
              {post.title}
            </h3>

            <p>
              카테고리 : {post.category}
            </p>

            <p>
              작성자 : {post.author}
            </p>

            {/* <p>
              유사도 : {post.similarity}
            </p> */}

          </div>
        ))
      }


    </div>
  );
}


export default App;