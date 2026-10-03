import type { Lesson, Library } from "@/lib/libraryTypes";

function lesson(
  id: string,
  title: string,
  english: string[],
  hindi: string[],
): Lesson {
  return { id, tabId: "", title, english, hindi, code: "" };
}

export function interviewLibrary(): Library {
  return {
    id: "interview",
    slug: "interview",
    title: "Interview",
    summary:
      "Pick a concept, answer 10 interview questions, then check your score.",
    accent: "#7c3aed",
    tabs: [],
    lessons: [
      lesson(
        "interview-js-scope",
        "JavaScript: let, const, and var",
        [
          "Question: What is the difference between let, const, and var?",
          "let and const belong to the block they are written in. var belongs to the function. const cannot be reassigned. let can. Prefer const, then let. Avoid var in new code.",
        ],
        [
          "Question: let, const, aur var mein kya farq hai?",
          "let aur const usi block mein rehte hain jahan likhe gaye hain. var function tak rehta hai. const ko dubara assign nahi kar sakte. let ko kar sakte hain. Naye code mein const, phir let. var avoid karo.",
        ],
      ),
      lesson(
        "interview-js-equal",
        "JavaScript: == and ===",
        [
          "Question: Why do interviewers prefer ===?",
          "=== checks value and type. == converts types first, so 1 == \"1\" is true and bugs hide. 1 === \"1\" is false. Use === unless you have a clear reason not to.",
        ],
        [
          "Question: Interviewer === ko kyun pasand karte hain?",
          "=== value aur type dono check karta hai. == pehle type badalta hai, isliye 1 == \"1\" true ho jata hai aur bug chhup jata hai. 1 === \"1\" false hai. Bina wajah == mat use karo.",
        ],
      ),
      lesson(
        "interview-react-state",
        "React: props and state",
        [
          "Question: What is the difference between props and state?",
          "Props come from the parent and the child should not change them. State is data the component owns. Call the setter from useState to change it. React then renders the new UI.",
        ],
        [
          "Question: Props aur state mein kya farq hai?",
          "Props parent se aate hain aur child unhe nahi badalta. State woh data hai jo component ke paas hai. Badalne ke liye useState ka setter call karo. React naya UI render karta hai.",
        ],
      ),
      lesson(
        "interview-react-keys",
        "React: why lists need keys",
        [
          "Question: Why does a list need a key?",
          "React uses the key to match items when the list changes. A stable id from the data is a good key. The array index is a weak key when items are inserted, moved, or deleted.",
        ],
        [
          "Question: List ko key kyun chahiye?",
          "Jab list badalti hai, React key se item pehchanta hai. Data ki stable id achhi key hai. Index kamzor key hai jab items beech mein add, move, ya delete hote hain.",
        ],
      ),
      lesson(
        "interview-node-what",
        "Node.js: what it is for",
        [
          "Question: What is Node.js used for?",
          "Node.js runs JavaScript outside the browser. People use it for APIs, servers, and tools. It is built on V8 and handles slow work, like the network, through an event loop instead of blocking the process.",
        ],
        [
          "Question: Node.js kis kaam ke liye use hota hai?",
          "Node.js JavaScript ko browser ke bahar chalata hai. Isse APIs, servers, aur tools bante hain. Ye V8 par bana hai. Network jaisa slow kaam event loop se hota hai, poori process rukti nahi.",
        ],
      ),
      lesson(
        "interview-next-server",
        "Next.js: server and client components",
        [
          "Question: When do you add use client?",
          "In the app router, components are server components unless the file starts with use client. Add that directive when the component needs state, effects, or browser events. Keep it as low in the tree as you can.",
        ],
        [
          "Question: use client kab likhte hain?",
          "App router mein component server component hota hai, jab tak file use client se shuru na ho. State, effects, ya browser events chahiye hon to ye directive likho. Ise tree mein jitna neeche ho sake, utna neeche rakho.",
        ],
      ),
      lesson(
        "interview-native-view",
        "React Native: View and Text",
        [
          "Question: Why is there no div in React Native?",
          "React Native draws native views, not HTML. View is the box. Text is the only place for words. A string directly inside a View does not work the way text inside a div does on the web.",
        ],
        [
          "Question: React Native mein div kyun nahi hota?",
          "React Native HTML nahi, native views banata hai. View box hai. Words sirf Text ke andar likhte hain. View ke andar seedha string web ke div ki tarah kaam nahi karti.",
        ],
      ),
      lesson(
        "interview-mongo-document",
        "MongoDB: documents",
        [
          "Question: How is a MongoDB document different from a table row?",
          "A document is a set of fields, stored as JSON-like data. Documents in one collection can have different shapes. Every document has an _id. A collection is the group of related documents.",
        ],
        [
          "Question: MongoDB document table ki row se kaise alag hai?",
          "Document fields ka set hai, JSON jaisa. Ek collection ke documents ka shape alag ho sakta hai. Har document ka _id hota hai. Collection related documents ka group hai.",
        ],
      ),
      lesson(
        "interview-mongoose-schema",
        "Mongoose: schema and populate",
        [
          "Question: What do a schema and populate do?",
          "A schema describes fields, types, and rules such as required. MongoDB itself will store almost any shape. The schema rejects bad data in your app. populate replaces a stored id with the related document when you query.",
        ],
        [
          "Question: Schema aur populate kya karte hain?",
          "Schema fields, types, aur rules batata hai, jaise required. MongoDB khud lagbhag koi bhi shape rakh leta hai. Schema galat data ko app mein reject karta hai. populate query ke time stored id ki jagah related document laga deta hai.",
        ],
      ),
    ],
  };
}
