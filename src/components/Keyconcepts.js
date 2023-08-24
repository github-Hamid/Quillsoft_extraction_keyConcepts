import axios from "axios";
import { useState } from "react";
import "./keyconcepts.css";

export default function KeyConcept() {
  const [values, setValues] = useState({
    text: "",
    maximumNumOfWords: "0",
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
    const result = await axios.post("http://localhost:3019/keyConcepts", {
      text: values.text,
      maximumNumOfWords: parseInt(values.maximumNumOfWords),
    });

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
