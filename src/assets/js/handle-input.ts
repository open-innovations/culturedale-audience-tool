import {
  CAT_RAW,
  inputHandler,
  readState,
  resetHandler,
  submitHandler,
} from "./_lib/handlers-input.ts";

// Add handlers to the form
const postcodeForm = document.querySelector<HTMLFormElement>(
  "form[name=input]",
);
if (!postcodeForm) throw new Error("No valid form found");

addEventListener("DOMContentLoaded", readState);
addEventListener(CAT_RAW, function (evt: CustomEvent<string>) {
  postcodeForm.postcodes.value = evt.detail;
});

postcodeForm.addEventListener("input", inputHandler);
postcodeForm.addEventListener("submit", submitHandler);
postcodeForm.addEventListener("reset", resetHandler);
