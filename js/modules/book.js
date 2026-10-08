// Keep in sync with --flip-duration in css/base/variables.css
const FLIP_DURATION = 900;
const FLIP_STAGGER = 150;
const MOBILE_QUERY = window.matchMedia("(max-width: 900px)");

export function initBook() {
    const binder = document.querySelector(".binder");
    const leaves = [...binder.querySelectorAll(".leaf")];
    // DOM order = reading order, so pages[2n] and pages[2n + 1] form spread n
    const pages = [...binder.querySelectorAll(".page")];
    const tabs = [...binder.querySelectorAll(".tab")];
    const prevBtn = binder.querySelector(".turn-btn--prev");
    const nextBtn = binder.querySelector(".turn-btn--next");
    const lastSpread = leaves.length;

    let current = 0;
    let isTurning = false;

    const spreadOf = (id) => {
        const index = pages.findIndex((page) => page.id === id);
        return index === -1 ? null : Math.floor(index / 2);
    };

    // Flipped leaves pile up on the left, the others on the right
    function stackLeaves() {
        leaves.forEach((leaf, i) => {
            leaf.style.zIndex = i < current ? i + 1 : leaves.length - i;
        });
    }

    function setActiveTabs(spread) {
        tabs.forEach((tab) => {
            const isActive = spreadOf(tab.hash.slice(1)) === spread;
            tab.classList.toggle("is-active", isActive);
            if (isActive) tab.setAttribute("aria-current", "page");
            else tab.removeAttribute("aria-current");
        });
    }

    function updateState() {
        const isMobile = MOBILE_QUERY.matches;
        // Hidden pages must not be reachable with the keyboard
        pages.forEach((page, i) => {
            page.inert = !isMobile && Math.floor(i / 2) !== current;
        });
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === lastSpread;
        if (!isMobile) setActiveTabs(current);
    }

    function goTo(target) {
        target = Math.max(0, Math.min(lastSpread, target));
        if (isTurning || target === current) return;

        isTurning = true;
        const forward = target > current;
        const turning = forward
            ? leaves.slice(current, target)
            : leaves.slice(target, current).reverse();

        turning.forEach((leaf, order) => {
            const start = order * FLIP_STAGGER;
            setTimeout(() => {
                leaf.style.zIndex = 100 - order;
                leaf.classList.toggle("is-flipped", forward);
            }, start);
            // Swap stacking order when the leaf is edge-on, so the swap is invisible
            setTimeout(() => {
                leaf.style.zIndex = 200 + order;
            }, start + FLIP_DURATION / 2);
        });

        current = target;
        updateState();

        setTimeout(() => {
            stackLeaves();
            isTurning = false;
        }, FLIP_DURATION + (turning.length - 1) * FLIP_STAGGER);
    }

    function jumpTo(target) {
        binder.classList.add("no-transition");
        current = target;
        leaves.forEach((leaf, i) => leaf.classList.toggle("is-flipped", i < current));
        stackLeaves();
        updateState();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => binder.classList.remove("no-transition"));
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", (event) => {
            if (MOBILE_QUERY.matches) return;
            event.preventDefault();
            goTo(spreadOf(tab.hash.slice(1)));
            history.replaceState(null, "", tab.hash);
        });
    });

    prevBtn.addEventListener("click", () => goTo(current - 1));
    nextBtn.addEventListener("click", () => goTo(current + 1));

    document.addEventListener("keydown", (event) => {
        if (MOBILE_QUERY.matches || event.target.closest("input, textarea")) return;
        if (event.key === "ArrowRight") goTo(current + 1);
        if (event.key === "ArrowLeft") goTo(current - 1);
    });

    // On mobile the pages are stacked: highlight the tab of the page being read
    const observer = new IntersectionObserver((entries) => {
        if (!MOBILE_QUERY.matches) return;
        entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveTabs(spreadOf(entry.target.id));
        });
    }, { rootMargin: "-45% 0px -55% 0px" });
    pages.forEach((page) => observer.observe(page));

    MOBILE_QUERY.addEventListener("change", updateState);

    jumpTo(spreadOf(location.hash.slice(1)) ?? 0);
}
