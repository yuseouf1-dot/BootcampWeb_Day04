export function initContactForm() {
    const form = document.querySelector("#contact-form");
    const status = form.querySelector(".form__status");
    const fields = form.querySelectorAll(".form__input");

    fields.forEach((field) => {
        field.addEventListener("input", () => field.classList.remove("is-invalid"));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        let isValid = true;
        fields.forEach((field) => {
            const fieldValid = field.checkValidity();
            field.classList.toggle("is-invalid", !fieldValid);
            if (!fieldValid) isValid = false;
        });

        if (!isValid) {
            status.textContent = "Please check for any blank fields or ensure your email address is in the correct format.";
            return;
        }

        // TODO: connect to a real backend or a service such as Formspree
        status.textContent = "Your message has been sent. Thank you!";
        form.reset();
        form.classList.add("is-sent");
    });

    form.addEventListener("animationend", (event) => {
        if (event.animationName === "stamp-in") form.classList.remove("is-sent");
    });
}
