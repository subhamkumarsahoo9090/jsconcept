// First-run seed only. Edits are stored in data/library.json.
export type Lesson = {
  title: string;
  english: string[];
  hindi: string[];
  code?: string;
};

export type TutorialCategory = {
  slug: string;
  title: string;
  summary: string;
  accent: string;
  lessons: Lesson[];
};

export const categories: TutorialCategory[] = [
  {
    slug: "node-js",
    title: "Node.js",
    summary: "Run JavaScript on the server, use npm, and answer HTTP requests.",
    accent: "#3c873a",
    lessons: [
      {
        title: "What Node.js is",
        english: [
          "Node.js runs JavaScript outside the browser. The same language you use on a page can read files, talk to a database, and serve an API.",
          "It is built on Chrome's V8 engine and uses an event loop. Slow work, like a network call, does not freeze the rest of the program. Node continues with other tasks and comes back when the result is ready.",
          "A typical start is a single file, started with node app.js. From there you add packages and split the app into modules.",
        ],
        hindi: [
          "Node.js JavaScript ko browser ke bahar chalata hai. Wahi language jo page par chalti hai, files padh sakti hai, database se baat kar sakti hai, aur API serve kar sakti hai.",
          "Ye Chrome ke V8 engine par bana hai aur event loop use karta hai. Network call jaisa slow kaam baaki program ko rokta nahi. Node dusre kaam karta rehta hai, aur result aane par wapas aata hai.",
          "Shuruaat aksar ek file se hoti hai, node app.js se. Uske baad packages aur alag modules add hote hain.",
        ],
      },
      {
        title: "Modules and npm",
        english: [
          "Node treats each file as a module. In modern Node you export with export and import with import. Older code uses module.exports and require. Pick one style and stay with it.",
          "npm is the package manager that ships with Node. npm init creates package.json, which lists your app name and dependencies. npm install express adds a library and records it.",
          "Never commit node_modules. Share package.json and package-lock.json so someone else can install the same versions.",
        ],
        hindi: [
          "Node har file ko ek module maanta hai. Naye Node mein export aur import use hote hain. Purana code module.exports aur require use karta hai. Ek style choose karke usi par raho.",
          "npm Node ke saath aane wala package manager hai. npm init package.json banata hai, jisme app ka naam aur dependencies likhe hote hain. npm install express library add karta hai.",
          "node_modules ko git mein mat daalo. package.json aur package-lock.json share karo, taaki doosra insaan wahi versions install kar sake.",
        ],
        code: `// math.js
export function add(a, b) {
  return a + b;
}

// app.js
import { add } from "./math.js";
console.log(add(2, 3));`,
      },
      {
        title: "A small HTTP server",
        english: [
          "The built-in http module can listen on a port and send a response. You do not need a framework to understand the request and response cycle.",
          "createServer receives a request and a response. You set a status, a content type, and the body, then end the response. listen starts the server.",
          "Frameworks such as Express sit on top of this idea and add routing, JSON helpers, and middleware.",
        ],
        hindi: [
          "Built-in http module ek port par sun sakta hai aur response bhej sakta hai. Request aur response cycle samajhne ke liye framework zaroori nahi.",
          "createServer ko request aur response milte hain. Aap status, content type, aur body set karke response end karte ho. listen server start karta hai.",
          "Express jaisa framework isi idea ke upar routing, JSON helpers, aur middleware jodta hai.",
        ],
        code: `import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from Node");
});

server.listen(3000);`,
      },
    ],
  },
  {
    slug: "javascript",
    title: "JavaScript",
    summary: "Values, functions, arrays, and asynchronous code.",
    accent: "#f7df1e",
    lessons: [
      {
        title: "Values and variables",
        english: [
          "A variable is a name for a value. Use const when the binding will not be reassigned, and let when it will. Avoid var in new code.",
          "JavaScript types include string, number, boolean, null, undefined, object, and symbol. Arrays and functions are objects with special behavior.",
          "=== compares value and type. == converts types first, which hides bugs. Prefer ===.",
        ],
        hindi: [
          "Variable ek value ka naam hai. const tab use karo jab binding badlegi nahi, aur let tab jab badlegi. Naye code mein var avoid karo.",
          "JavaScript types mein string, number, boolean, null, undefined, object, aur symbol aate hain. Array aur function bhi object hain, lekin unka behavior khaas hota hai.",
          "=== value aur type dono compare karta hai. == pehle type convert karta hai, isliye bugs chhup sakte hain. === behtar hai.",
        ],
        code: `const name = "Subham";
let score = 10;
score = score + 5;

console.log(name, score);`,
      },
      {
        title: "Functions and arrays",
        english: [
          "A function is a reusable block. Parameters are the inputs. The return value is what the caller receives. If you forget return, the result is undefined.",
          "Arrow functions are a short form. They are handy for callbacks. A method that uses this should usually stay a regular function.",
          "Arrays hold ordered values. map builds a new array, filter keeps matching items, and find returns the first match.",
        ],
        hindi: [
          "Function ek dobara use hone wala block hai. Parameters input hain. return wahi value hai jo caller ko milti hai. return bhool gaye to result undefined hota hai.",
          "Arrow function chhota form hai. Callbacks ke liye ye aasaan hai. Jo method this use karta hai, use aksar normal function hi rehna chahiye.",
          "Array ordered values rakhta hai. map naya array banata hai, filter matching items rakhta hai, aur find pehla match deta hai.",
        ],
        code: `const prices = [10, 25, 8];
const withTax = prices.map((price) => price * 1.18);
const costly = prices.filter((price) => price > 15);`,
      },
      {
        title: "Promises and async",
        english: [
          "A promise represents work that finishes later. It can succeed with a value or fail with an error. then handles success. catch handles failure.",
          "async and await let you write that flow like normal steps. await pauses that function until the promise settles. The rest of the program keeps running.",
          "Wrap awaited calls in try and catch when failure is possible, such as a network request.",
        ],
        hindi: [
          "Promise aisa kaam dikhata hai jo baad mein khatam hota hai. Ye value ke saath succeed ho sakta hai ya error ke saath fail. then success handle karta hai. catch failure handle karta hai.",
          "async aur await se ye flow normal steps jaisa likha jata hai. await us function ko rokta hai jab tak promise settle na ho. Baaki program chalta rehta hai.",
          "Jahan failure ho sakti hai, jaise network request, wahan awaited call ko try aur catch mein rakho.",
        ],
        code: `async function loadUser(id) {
  try {
    const response = await fetch("/api/users/" + id);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}`,
      },
    ],
  },
  {
    slug: "react",
    title: "React",
    summary: "Build screens from components, props, and state.",
    accent: "#61dafb",
    lessons: [
      {
        title: "Components and JSX",
        english: [
          "A React component is a function that returns UI. The name starts with a capital letter. You use it like an HTML tag.",
          "JSX looks like HTML inside JavaScript. Curly braces insert a value. A component returns one parent, or a fragment if you do not want an extra element.",
          "Keep components small. A page is a tree of components, each responsible for one piece of the screen.",
        ],
        hindi: [
          "React component ek function hai jo UI return karta hai. Naam capital letter se shuru hota hai. Use HTML tag ki tarah likhte hain.",
          "JSX JavaScript ke andar HTML jaisa dikhta hai. Curly braces mein value daalte hain. Component ek parent return karta hai, ya fragment jab extra element nahi chahiye.",
          "Components chhote rakho. Page components ka tree hota hai, aur har component screen ka ek hissa sambhalta hai.",
        ],
        code: `function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}

export default function Page() {
  return <Greeting name="Subham" />;
}`,
      },
      {
        title: "Props and state",
        english: [
          "Props are inputs passed from a parent. The child should treat them as read-only. If the parent passes a new name, React renders the child again.",
          "State is data the component owns and can change. useState returns the current value and a setter. Call the setter to update. Do not change the state object in place.",
          "When state changes, React calculates the new UI and updates the DOM for you.",
        ],
        hindi: [
          "Props parent se aane wale inputs hain. Child unhe read-only maane. Parent naya name de to React child ko dubara render karta hai.",
          "State woh data hai jo component ke paas hai aur badal sakta hai. useState current value aur setter deta hai. Update ke liye setter call karo. State object ko seedha mat badlo.",
          "State badalte hi React naya UI nikalta hai aur DOM khud update karta hai.",
        ],
        code: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count {count}
    </button>
  );
}`,
      },
      {
        title: "Lists and events",
        english: [
          "Render a list with map. Each item needs a stable key so React can match items when the list changes. The key should come from the data, not from the array index, when items can move or be deleted.",
          "Events use camelCase names such as onClick and onChange. The handler receives a synthetic event. Call preventDefault on a form submit if you handle it in JavaScript.",
          "Lift shared state to the closest parent that needs it, then pass values and setters down as props.",
        ],
        hindi: [
          "List map se render hoti hai. Har item ko stable key chahiye, taaki list badle to React items ko pehchan sake. Jab items move ya delete ho sakte hain, key data se aani chahiye, index se nahi.",
          "Events ke naam camelCase hote hain, jaise onClick aur onChange. Handler ko event milta hai. Form submit JavaScript se handle karo to preventDefault call karo.",
          "Shared state us sabse nazdeek parent par rakho jise uski zaroorat hai, phir values aur setters props se neeche bhejo.",
        ],
        code: `const topics = ["React", "Next.js"];

export function TopicList() {
  return (
    <ul>
      {topics.map((topic) => (
        <li key={topic}>{topic}</li>
      ))}
    </ul>
  );
}`,
      },
    ],
  },
  {
    slug: "next-js",
    title: "Next.js",
    summary: "Pages, layouts, and the split between server and client.",
    accent: "#111111",
    lessons: [
      {
        title: "The app router",
        english: [
          "In the app directory, a folder is a route and page.tsx is the screen. app/dashboard/page.tsx becomes /dashboard.",
          "A folder in parentheses, such as (public), groups routes without changing the URL. A folder in square brackets, such as [slug], is a dynamic segment.",
          "You can export metadata from a page so the title and description stay with that route.",
        ],
        hindi: [
          "app directory mein folder route hai aur page.tsx screen hai. app/dashboard/page.tsx ka URL /dashboard hota hai.",
          "Parentheses wala folder, jaise (public), routes ko group karta hai bina URL badle. Square brackets wala folder, jaise [slug], dynamic segment hai.",
          "Page se metadata export kar sakte ho, taaki title aur description usi route ke saath rahein.",
        ],
        code: `// app/dashboard/page.tsx
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}`,
      },
      {
        title: "Layouts and links",
        english: [
          "layout.tsx wraps the pages in that segment. It stays mounted when you move between child routes, so shared chrome like a sidebar does not remount every time.",
          "Use the Link component for in-app navigation. It prefetches the next page and avoids a full browser reload.",
          "usePathname tells a client component which URL is active, which is how a nav item shows the current page.",
        ],
        hindi: [
          "layout.tsx us segment ke pages ko wrap karta hai. Child routes ke beech jaane par ye mounted rehta hai, isliye sidebar har baar dubara mount nahi hota.",
          "App ke andar navigation ke liye Link use karo. Ye agla page prefetch karta hai aur poora browser reload nahi karta.",
          "usePathname client component ko batata hai kaunsa URL active hai. Isi se nav item current page dikhata hai.",
        ],
        code: `import Link from "next/link";

export function TopicLink() {
  return <Link href="/dashboard/react">React</Link>;
}`,
      },
      {
        title: "Server and client components",
        english: [
          "Components in the app router are server components by default. They can read files and secrets and they do not ship their logic to the browser.",
          "Add use client at the top when you need state, effects, or browser events. Keep that boundary as low in the tree as you can.",
          "A server layout can pass a server page as children into a client shell. That is how this dashboard protects pages and still renders lesson content on the server.",
        ],
        hindi: [
          "App router mein components by default server components hote hain. Ye files aur secrets padh sakte hain, aur unka logic browser ko nahi jaata.",
          "State, effects, ya browser events chahiye hon to file ke top par use client likho. Ye boundary tree mein jitni neeche ho sake, utni neeche rakho.",
          "Server layout ek server page ko children ki tarah client shell mein bhej sakta hai. Isi tarah ye dashboard pages ko protect karta hai aur lessons server par render karta hai.",
        ],
      },
    ],
  },
  {
    slug: "react-native",
    title: "React Native",
    summary: "React for iOS and Android, with native views instead of HTML.",
    accent: "#0ea5e9",
    lessons: [
      {
        title: "Native views, not HTML",
        english: [
          "React Native uses React, but the host is a phone, not a browser. There is no div or span. View is a box, Text shows words, and Pressable handles taps.",
          "Text must live inside a Text component. Putting a string directly in a View does not work the way a div does on the web.",
          "The component model is the same idea as React: small functions, props in, UI out.",
        ],
        hindi: [
          "React Native React use karta hai, lekin host browser nahi, phone hai. Yahan div ya span nahi hota. View ek box hai, Text words dikhata hai, aur Pressable tap handle karta hai.",
          "Text ko Text component ke andar hona chahiye. View ke andar seedha string web ke div ki tarah kaam nahi karta.",
          "Component model React jaisa hi hai: chhote functions, props andar, UI bahar.",
        ],
        code: `import { Text, View } from "react-native";

export function Hello() {
  return (
    <View>
      <Text>Hello from React Native</Text>
    </View>
  );
}`,
      },
      {
        title: "StyleSheet and flex",
        english: [
          "Styles are JavaScript objects, usually created with StyleSheet.create. Names are camelCase, so backgroundColor instead of background-color.",
          "Layout uses flexbox, and the default direction is column. flex: 1 makes a view fill the space its parent offers.",
          "There is no CSS cascade. Each component gets the styles you pass. Share tokens, such as colors, from one file.",
        ],
        hindi: [
          "Styles JavaScript objects hain, aksar StyleSheet.create se. Naam camelCase hote hain, isliye background-color ki jagah backgroundColor.",
          "Layout flexbox use karta hai, aur default direction column hai. flex: 1 view ko parent ki khali jagah bharne deta hai.",
          "Yahan CSS cascade nahi hai. Har component ko wahi styles milte hain jo aap dete ho. Colors jaise tokens ek file se share karo.",
        ],
        code: `import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#fffdf8" },
});

export function Screen() {
  return <View style={styles.screen} />;
}`,
      },
      {
        title: "Screens and navigation",
        english: [
          "A mobile app is a stack of screens. React Navigation is the common library. A stack navigator pushes a screen and pops it when the user goes back.",
          "Each screen is still a React component. Route params carry an id, the same job a URL segment does on the web.",
          "Platform differences belong in a small place. Most UI can stay shared if you stick to View, Text, and Pressable.",
        ],
        hindi: [
          "Mobile app screens ka stack hota hai. React Navigation common library hai. Stack navigator screen push karta hai aur back par pop karta hai.",
          "Har screen phir bhi ek React component hai. Route params id le jaate hain, jaise web par URL segment karta hai.",
          "Platform differences chhoti jagah par rakho. Zyadatar UI View, Text, aur Pressable se shared reh sakta hai.",
        ],
      },
    ],
  },
  {
    slug: "mongodb",
    title: "MongoDB",
    summary: "Store documents in collections and query them.",
    accent: "#00684a",
    lessons: [
      {
        title: "Documents and collections",
        english: [
          "MongoDB stores JSON-like documents. A document is a set of fields. Related documents live in a collection, similar to rows in a table, but each document can have a different shape.",
          "Every document has an _id. If you do not set one, MongoDB creates an ObjectId.",
          "A database holds many collections. One app often uses one database and a collection per kind of thing, such as users or lessons.",
        ],
        hindi: [
          "MongoDB JSON jaise documents store karta hai. Document fields ka set hai. Related documents ek collection mein rehte hain. Ye table ki rows jaisa hai, lekin har document ka shape alag ho sakta hai.",
          "Har document ka _id hota hai. Aap na do to MongoDB ObjectId bana deta hai.",
          "Ek database mein kai collections hoti hain. Aksar ek app ek database use karti hai, aur har cheez ki alag collection, jaise users ya lessons.",
        ],
        code: `{
  "_id": "lesson-1",
  "title": "Documents and collections",
  "topic": "MongoDB"
}`,
      },
      {
        title: "Create, read, update, delete",
        english: [
          "insertOne adds a document. find looks up documents. findOne returns the first match. updateOne changes fields. deleteOne removes a document.",
          "A filter is a query object. { topic: \"MongoDB\" } matches documents whose topic field equals that string.",
          "$set changes only the fields you name. Without it, a naive replace can wipe the rest of the document.",
        ],
        hindi: [
          "insertOne document add karta hai. find documents dhoondhta hai. findOne pehla match deta hai. updateOne fields badalta hai. deleteOne document hata deta hai.",
          "Filter ek query object hai. { topic: \"MongoDB\" } un documents ko match karta hai jinka topic field wahi string hai.",
          "$set sirf un fields ko badalta hai jinhe aap naam dete ho. Bina iske poora document replace ho sakta hai aur baaki fields mit sakti hain.",
        ],
        code: `await lessons.insertOne({ title: "CRUD", topic: "MongoDB" });

await lessons.updateOne(
  { title: "CRUD" },
  { $set: { published: true } },
);`,
      },
      {
        title: "Useful queries",
        english: [
          "Comparison operators live under a field. $gt means greater than, $in means one of these values, and $ne means not equal.",
          "sort, skip, and limit shape the result. Sort by a field, skip earlier pages, and limit the page size.",
          "An index on a field you filter or sort by keeps the query fast as the collection grows. The _id field is indexed already.",
        ],
        hindi: [
          "Comparison operators field ke andar likhe jaate hain. $gt ka matlab greater than, $in ka matlab in values mein se ek, aur $ne ka matlab not equal.",
          "sort, skip, aur limit result ko shape karte hain. Field se sort karo, pichhle pages skip karo, aur page size limit karo.",
          "Jis field par filter ya sort karte ho, us par index query ko tez rakhta hai jab collection badi ho. _id pehle se indexed hai.",
        ],
        code: `await lessons
  .find({ topic: "MongoDB" })
  .sort({ title: 1 })
  .limit(10)
  .toArray();`,
      },
    ],
  },
  {
    slug: "mongoose",
    title: "Mongoose",
    summary: "Schemas, models, and validation on top of MongoDB.",
    accent: "#880000",
    lessons: [
      {
        title: "Schemas",
        english: [
          "Mongoose is a library for Node that describes the shape of a MongoDB document. A schema lists fields, their types, and rules such as required or unique.",
          "MongoDB itself will store almost any shape. The schema is your app's contract, so bad data is rejected before it is saved.",
          "Default values and timestamps can be declared once on the schema instead of repeated in every insert.",
        ],
        hindi: [
          "Mongoose Node ki library hai jo MongoDB document ka shape batati hai. Schema fields, unke types, aur rules likhta hai, jaise required ya unique.",
          "MongoDB khud lagbhag koi bhi shape rakh leta hai. Schema aapki app ka contract hai, isliye galat data save hone se pehle reject ho jata hai.",
          "Default values aur timestamps schema par ek baar likh sakte ho, har insert mein dohrane ki zaroorat nahi.",
        ],
        code: `import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { timestamps: true },
);`,
      },
      {
        title: "Models and validation",
        english: [
          "A model is a constructor compiled from a schema. It is tied to a collection. Lesson.create inserts a document and runs validators first.",
          "If a required field is missing, save fails with a validation error. Read error.errors to see which fields failed.",
          "Connect once when the app starts, with mongoose.connect and your database URL. Do not open a new connection on every request.",
        ],
        hindi: [
          "Model schema se bana constructor hai. Ye ek collection se juda hota hai. Lesson.create document insert karta hai aur pehle validators chalata hai.",
          "Required field missing ho to save validation error ke saath fail hota hai. error.errors se pata chalta hai kaunse fields fail hue.",
          "App start par mongoose.connect se ek baar connect karo, apne database URL ke saath. Har request par naya connection mat kholo.",
        ],
        code: `const Lesson = mongoose.model("Lesson", lessonSchema);

await Lesson.create({
  title: "Schemas",
  topic: "Mongoose",
});`,
      },
      {
        title: "References between documents",
        english: [
          "A field can store another document's id. In the schema, set the type to ObjectId and ref to the other model name.",
          "populate replaces that id with the related document when you query. Use it when the screen needs both records.",
          "Do not populate everything by default. Extra joins cost time. Load the related document only on the route that needs it.",
        ],
        hindi: [
          "Ek field doosre document ki id rakh sakti hai. Schema mein type ObjectId rakho aur ref mein doosre model ka naam.",
          "populate query ke time us id ki jagah related document laga deta hai. Jab screen ko dono records chahiye, tab use karo.",
          "Sab kuch by default populate mat karo. Extra joins time lete hain. Related document sirf us route par load karo jise uski zaroorat hai.",
        ],
        code: `const noteSchema = new mongoose.Schema({
  body: String,
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
});

const notes = await Note.find().populate("lesson");`,
      },
    ],
  },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
