import { Showcase } from "./Showcase";
import { Slides } from "./Slides";
import { Cursor } from "./Cursor";
import image1 from "../images/Sahyadri.jpg";
import image2 from "../images/Rann-of-kutchh.jpg";
import image3 from "../images/Hampi.jpg";
import image4 from "../images/Jatayu.jpg";
import image5 from "../images/Dhanbad.jpg";

const container = document.getElementById("app");
const cursor = new Cursor(document.querySelector(".cursor"));
const slidesData = [
  {
    image: image1,
    title: "Sahyadri",
    meta: "Maharashtra / India"
  },
  {
    image: image2,
    title: "Kutch",
    meta: "Gujrat / India"
  },
  {
    image: image3,
    title: "Hampi",
    meta: "Karnataka / India"
  },
  {
    image: image4,
    title: "Jatayu",
    meta: "Kerala / India"
  },
  {
    image: image5,
    title: "Dhanbad",
    meta: "Jharkhand / India"
  }
];

const slides = new Slides(slidesData);
const showcase = new Showcase(slidesData, {
  onActiveIndexChange: activeIndex => {
    slides.onActiveIndexChange(activeIndex);
  },
  onIndexChange: index => {
    slides.onMove(index);
  },
  onZoomOutStart: ({ activeIndex }) => {
    cursor.enter();
    slides.appear();
  },
  onZoomOutFinish: ({ activeIndex }) => { },
  onFullscreenStart: ({ activeIndex }) => {
    cursor.leave();
    slides.disperse(activeIndex);
  },
  onFullscreenFinish: ({ activeIndex }) => { }
});

showcase.mount(container);
slides.mount(container);
showcase.render();

window.addEventListener("resize", function () {
  showcase.onResize();
});

window.addEventListener("mousemove", function (ev) {
  showcase.onMouseMove(ev);
});
