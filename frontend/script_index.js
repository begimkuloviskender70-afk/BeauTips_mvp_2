
const btn = document.getElementById("consultBtn");
const circle = btn.querySelector(".hero-btn-icon-circle");

btn.addEventListener("click", function (e) {
    e.preventDefault();

    const btnStyles = getComputedStyle(btn);
    const paddingLeft = parseFloat(btnStyles.paddingLeft);
    const paddingRight = parseFloat(btnStyles.paddingRight);
    const btnWidth = btn.offsetWidth;
    const circleWidth = circle.offsetWidth;

    const shift = btnWidth - paddingRight - circleWidth - paddingLeft;

    circle.style.setProperty("--circle-shift", shift + "px");

    btn.classList.add("animating");

    setTimeout(() => {
        window.location.href = btn.getAttribute("href");
    }, 600);
});

