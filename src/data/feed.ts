export type Photo = {
  src: string;        // file in public/photos, e.g. "/photos/02-flick.jpg"
  position?: string;  // CSS object-position, e.g. "center top"
  credit?: string;    // optional, shown only if present
  creditUrl?: string;
};

export type FeedItem = {
  url: string;
  category: "barca" | "epl" | "ucl" | "transfers" | "tactics" | "opinion";
  title?: string;         // overrides the caption fetched from TikTok
  views?: number;         // type the count from TikTok; leave out to hide it
  photo?: Photo;          // main tile image
  cover?: string;         // illustrated fallback, e.g. "/thumbs/01-atletico-joy.png"
  thumbPosition?: string;
};

export const feed: FeedItem[] = [
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687385234316348680",
    category: "opinion",
    title: "ATLETICO Madrid I believe in you, Give us Joy against Real Madrid",
    photo: { src: "/photos/01-madrid-atletico.jpg", position: "center top" },
    cover: "/thumbs/01-atletico-joy.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687377009575513352",
    category: "barca",
    title: "Hansi Flick is an incredible Man Manager, The way he is managing Gordon and ADEYEMI is top",
    photo: { src: "/photos/02-flick.jpg", position: "center top" },
    cover: "/thumbs/02-flick-man-manager.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687365320117423378",
    category: "barca",
    title: "Lamine Yamal and Raphinha have now contributed 31 G/A in 8 games so far Barcelona",
    photo: { src: "/photos/03-yamal.jpg", position: "center top" },
    cover: "/thumbs/03-yamal-raphinha-31-ga.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687359911050628360",
    category: "barca",
    title: "RAPHINHA with a HATRICK but Rodri was my man of the match",
    photo: { src: "/photos/04-raphinha.jpg", position: "center top" },
    cover: "/thumbs/04-raphinha-hattrick-rodri-motm.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687347997054618898",
    category: "barca",
    title: "Another HATRICK for the best Striker in the world RAPHINHA",
    photo: { src: "/photos/05-raphinha-2.jpg", position: "center top" },
    cover: "/thumbs/05-raphinha-hattrick-big3.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687338747234405640",
    category: "barca",
    title: "Another HATRICK for the best Striker in the world RAPHINHA",
    photo: { src: "/photos/06-sevilla-barca.jpg", position: "center top" },
    cover: "/thumbs/06-raphinha-hattrick-goal-net.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687303776067194119",
    category: "opinion",
    title: "Barcelona is the only club that i support that affects my emotions, my support for Arsenal is just based on Premier League and Sentimental attachment",
    photo: { src: "/photos/07-barcelona.jpg", position: "center top" },
    cover: "/thumbs/07-barca-emotions-arsenal.png",
  },
  {
    url: "https://www.tiktok.com/@ultimatekombo2/video/7687290370878721298",
    category: "barca",
    title: "Hansi Flick ball against Sevilla tonight, i need to watch beautiful football",
    photo: { src: "/photos/08-flick-sevilla.jpg", position: "center top" },
    cover: "/thumbs/08-flick-ball-vs-sevilla.png",
  },
];