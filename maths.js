function findPerspective(elements, fovy, aspect, near, far) {
  let e;
  let rd;
  let s;
  let ct;

  if (near === far || aspect === 0) {
    throw "null frustum";
  }
  if (near <= 0) {
    throw "near <= 0";
  }
  if (far <= 0) {
    throw "far <= 0";
  }

  fovy /= 2;
  s = Math.sin(fovy);
  if (s === 0) {
    throw "null frustum";
  }

  rd = 1 / (far - near);
  ct = Math.cos(fovy) / s;

  e = elements;

  e[0] = ct / aspect;
  e[1] = 0;
  e[2] = 0;
  e[3] = 0;

  e[4] = 0;
  e[5] = ct;
  e[6] = 0;
  e[7] = 0;

  e[8] = 0;
  e[9] = 0;
  e[10] = -(far + near) * rd;
  e[11] = -1;

  e[12] = 0;
  e[13] = 0;
  e[14] = -2 * near * far * rd;
  e[15] = 0;

  return e;
}

function lerp(a, b, t) {
  const out = [];
  const ax = a[0];
  const ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}

function distanceToSquared(a, b) {
  var dx = a[0] - b[0],
    dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function distanceTo(a, b) {
  return Math.sqrt(distanceToSquared(a, b));
}

function* iterate(arr) {
  for (let i = 1; i < arr.length; i++) {
    yield arr[i];
  }
}

function findExtremeValues(plots) {
  const maxX = Math.max(...iterate(plots[0]));
  const minX = Math.min(...iterate(plots[0]));
  const yMaxValues = [];
  const yMinValues = [];
  for (let i = 1; i < plots.length; i++) {
    yMaxValues.push(Math.max(...iterate(plots[i])));
    yMinValues.push(Math.min(...iterate(plots[i])));
  }

  const extremeValuesMap = {
    x: {
      max: maxX,
      min: minX
    },
    y: {
      max: Math.max(...yMaxValues),
      min: Math.min(...yMinValues)
    }
  };
  return extremeValuesMap;
}

function generatePoints(x, y, extremeValues) {
  const maxY = extremeValues.y.max; //Math.max(...iterate(y));
  const minY = extremeValues.y.min; // Math.min(...iterate(y));
  console.log("max", maxY);
  const maxX = extremeValues.x.max; // Math.max(...iterate(x));
  const minX = extremeValues.x.min; //Math.min(...iterate(x));

  const resultArray = new Array(x.length - 1 + y.length - 1);
  for (let i = 0; i < resultArray.length / 2; i += 2) {
    resultArray[i] = (2 * (x[i + 1] - minX)) / (maxX - minX) - 1;
    resultArray[i + 1] = (2 * (y[i + 1] - minY)) / (maxY - minY) - 1;
    if (isNaN(resultArray[i]) || isNaN(resultArray[i + 1])) {
      debugger;
    }
  }

  const points = [];
  for (let i = 0; i < resultArray.length - 2; i += 2) {
    const a = [resultArray[i], resultArray[i + 1]];
    const b = [resultArray[i + 2], resultArray[i + 3]];

    let step = distanceTo(a, b) * 1800;
    for (let j = 0; j < step; j++) {
      points.push(lerp(a, b, j / step));
    }
  }

  return points.flat();
}

export { findPerspective, lerp, distanceTo, findExtremeValues, generatePoints };
