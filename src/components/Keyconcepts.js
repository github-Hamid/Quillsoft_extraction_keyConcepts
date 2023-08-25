import axios from "axios";
import { useState } from "react";
import "./keyconcepts.css";

export default function KeyConcept() {
  const [values, setValues] = useState({
    text: "",
    maximumNumOfWords: "0",
    numOfKeywords: "20",
  });
  const [response, setResponse] = useState(undefined);
  function handleChange(e) {
    console.log(e.target.name, "-----", e.target.value);
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  }
  async function handleSubmit(e) {
    e.preventDefault();
    console.log(values);
    const result = await axios.post(
      "http://localhost:3019/keyConcepts",
      {
        text: values.text,
        maximumNumOfWords: parseInt(values.maximumNumOfWords),
        numOfKeywords: parseInt(values.numOfKeywords),
      },
      {
        withCredentials: true,
      }
    );

    setResponse(result.data);
  }
  return (
    <div className="container">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="container-text">
            <textarea
              placeholder="Enter Your Text Here..."
              rows="6"
              style={{ width: "80%", margin: "auto", display: "block" }}
              name="text"
              value={values.text}
              onChange={handleChange}
            />
          </div>
          <div className="num-of-keyphrase-container">
            <div className="first">
              <label className="label" htmlFor="maximumNumOfWords">
                Maximum number of keyphrases words:
              </label>
            </div>

            <div className="second">
              <div className="radio-container">
                <input
                  type="radio"
                  name="maximumNumOfWords"
                  value={2}
                  id="2"
                  checked={values.maximumNumOfWords === "2"}
                  onChange={handleChange}
                />
                <label htmlFor="2" className="custom-radio">
                  2
                </label>
              </div>
              <div className="radio-container">
                <input
                  type="radio"
                  name="maximumNumOfWords"
                  value={3}
                  id="3"
                  checked={values.maximumNumOfWords === "3"}
                  onChange={handleChange}
                />
                <label htmlFor="3" className="custom-radio">
                  3
                </label>
              </div>
              <div className="radio-container">
                <input
                  type="radio"
                  name="maximumNumOfWords"
                  value={0}
                  id="any"
                  checked={values.maximumNumOfWords === "0"}
                  onChange={handleChange}
                />
                <label htmlFor="any" className="custom-radio">
                  Any
                </label>
              </div>
            </div>
          </div>

          <div className="num-of-keyphrase-container">
            <div className="first">
              <label className="label" htmlFor="numOfKeywords">
                Number of keywords for each keyphrase:
              </label>
            </div>

            <div className="second">
              <div className="radio-container">
                <input
                  type="radio"
                  name="numOfKeywords"
                  value={5}
                  id="5"
                  checked={values.numOfKeywords === "5"}
                  onChange={handleChange}
                />
                <label htmlFor="5" className="custom-radio">
                  5
                </label>
              </div>
              <div className="radio-container">
                <input
                  type="radio"
                  name="numOfKeywords"
                  value={10}
                  id="10"
                  checked={values.numOfKeywords === "10"}
                  onChange={handleChange}
                />
                <label htmlFor="10" className="custom-radio">
                  10
                </label>
              </div>
              <div className="radio-container">
                <input
                  type="radio"
                  name="numOfKeywords"
                  value={20}
                  id="20"
                  checked={values.numOfKeywords === "20"}
                  onChange={handleChange}
                />
                <label htmlFor="20" className="custom-radio">
                  20
                </label>
              </div>
            </div>
          </div>

          <div className="btn-container">
            <button className="submit-button" type="submit">
              Submit
            </button>
          </div>
        </form>
      </div>
      <div className="result">
        {response && JSON.stringify(response, null, 2)}
      </div>
    </div>
  );
}
