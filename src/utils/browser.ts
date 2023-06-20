"use client";

export const LOCALSTORAGE_MAX_CAPACITY = 4_398_045.12; // 4.2 MB

/** Result in bytes */
export function getLocalStorageSize() {
  let _lsTotal = 0,
    _xLen,
    _x;

  for (_x in localStorage) {
    if (!localStorage.hasOwnProperty(_x)) {
      continue;
    }

    _xLen = (localStorage[_x].length + _x.length) * 2;
    _lsTotal += _xLen;
  }

  return _lsTotal;
}
