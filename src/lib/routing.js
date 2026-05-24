export function getHashValue() {
  return window.location.hash.replace(/^#/, "");
}

export function navigateTo(hash) {
  if (getHashValue() === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }

  window.location.hash = hash;
}
