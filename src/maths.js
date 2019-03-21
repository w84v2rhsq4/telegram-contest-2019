//prettier-ignore
const identityMatrix = [
  1, 0, 0, 0, 
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1 
];

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

function getProjectionByAspect(aspect) {
  return findPerspective(
    new Float32Array(identityMatrix),
    Math.PI / 2,
    aspect, // 0 .. 1
    0.01,
    10
  );
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
  const extremeValuesMap = {
    x: {
      max: maxX,
      min: minX
    }
  };
  const yMaxValues = [];
  const yMinValues = [];
  for (let i = 1; i < plots.length; i++) {
    const maxYi = Math.max(...iterate(plots[i]));
    const minYi = Math.min(...iterate(plots[i]));
    // debugger;
    extremeValuesMap[plots[i][0]] = {
      max: maxYi,
      min: minYi
    };
    yMaxValues.push(maxYi);
    yMinValues.push(minYi);
  }

  extremeValuesMap.y = {
    max: Math.max(...yMaxValues),
    min: Math.min(...yMinValues)
  };
  return extremeValuesMap;
}

function generatePoints(x, y, extremeValues) {
  const maxY = extremeValues.y.max; //Math.max(...iterate(y));
  // const minY = extremeValues.y.min; // Math.min(...iterate(y));
  //   console.log("max", maxY);
  const maxX = extremeValues.x.max; // Math.max(...iterate(x));
  const minX = extremeValues.x.min; //Math.min(...iterate(x));

  const resultArray = new Array(x.length - 1 + y.length - 1);
  let index = 1;
  for (let i = 0; i < resultArray.length; i += 2) {
    resultArray[i] = (2 * (x[index] - minX)) / (maxX - minX) - 1;
    resultArray[i + 1] = (2 * (y[index] - 0)) / (maxY - 0) - 1;
    // if (isNaN(resultArray[i]) || isNaN(resultArray[i + 1])) {
    //   debugger;
    // }
    index++;
  }

  const points = [];
  for (let i = 0; i < resultArray.length; i += 2) {
    const a = [resultArray[i], resultArray[i + 1]];
    const b = [resultArray[i + 2], resultArray[i + 3]];

    if (a[0] && b[0]) {
      let step = Math.max(distanceTo(a, b), 0.1) * 1000;
      //let step = distanceTo(a, b) * 100;
      for (let j = 0; j < step; j++) {
        points.push(lerp(a, b, j / step));
      }
    } else {
      points.push(a);
    }
  }

  return {
    originalPoints: resultArray,
    generatedPoints: points.flat()
  };
}

function hexToRgb(hex) {
  return hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => "#" + r + r + g + g + b + b
    )
    .substring(1)
    .match(/.{2}/g)
    .map(x => parseInt(x, 16));
}

function hexToNormalizedRgb(hex) {
  return hexToRgb(hex).map(c => c / 255);
}

function normalizeValueToRange({ value, a, b, minValue, maxValue }) {
  return ((b - a) * (value - minValue)) / (maxValue - minValue) + a;
}

export {
  getProjectionByAspect,
  lerp,
  distanceTo,
  findExtremeValues,
  generatePoints,
  hexToNormalizedRgb,
  normalizeValueToRange
};
