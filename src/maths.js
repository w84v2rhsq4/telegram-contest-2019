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

// prettier-ignore
function getInverse(src, dst) {
  // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
  var te = dst,
  me = src,

  n11 = me[ 0 ], n21 = me[ 1 ], n31 = me[ 2 ], n41 = me[ 3 ],
  n12 = me[ 4 ], n22 = me[ 5 ], n32 = me[ 6 ], n42 = me[ 7 ],
  n13 = me[ 8 ], n23 = me[ 9 ], n33 = me[ 10 ], n43 = me[ 11 ],
  n14 = me[ 12 ], n24 = me[ 13 ], n34 = me[ 14 ], n44 = me[ 15 ],

  t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
  t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
  t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
  t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

  var det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

  if ( det === 0 ) {
    return identityMatrix;
  }

  var detInv = 1 / det;

  te[ 0 ] = t11 * detInv;
  te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
  te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
  te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

  te[ 4 ] = t12 * detInv;
  te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
  te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
  te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

  te[ 8 ] = t13 * detInv;
  te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
  te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
  te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

  te[ 12 ] = t14 * detInv;
  te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
  te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
  te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

  return dst;
}

function multiplyVector4(vec, mat) {
  const e = mat;
  const p = vec;
  const result = new Float32Array(4);

  result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[8] + p[3] * e[12];
  result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[9] + p[3] * e[13];
  result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
  result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

  return result;
}

function findIndexOfClosestValue(array, value) {
  return array.reduce((prev, _, i) => {
    if (i === 0) {
      return 1;
    }
    return Math.abs(array[i] - value) < Math.abs(array[prev] - value)
      ? i
      : prev;
  }, 0);
}

function getExtreme(arr) {
  let max = arr[1];
  let min = arr[1];
  for (let i = 2; i < arr.length; i++) {
    max = Math.max(max, arr[i]);
    min = Math.min(min, arr[i]);
  }

  return { max, min };
}

function findExtremeValues(plots, start, end) {
  const extremeValuesMap = {};

  const xPlot = plots[0];
  if (start === undefined) {
    extremeValuesMap.x = {
      max: xPlot[xPlot.length - 1],
      min: xPlot[1]
    };
  } else {
    extremeValuesMap.x = {
      max: xPlot[end],
      min: xPlot[start + 1]
    };
  }

  const yMaxValues = [];
  const yMinValues = [];
  for (let i = 1; i < plots.length; i++) {
    const pointsY = start !== undefined ? plots[i].slice(start, end) : plots[i];

    const { max: maxYi, min: minYi } = getExtreme(pointsY);
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
  const maxY = extremeValues.y.max;
  const maxX = extremeValues.x.max;
  const minX = extremeValues.x.min;

  const resultArray = new Array(x.length - 1 + y.length - 1);
  let index = 1;
  for (let i = 0; i < resultArray.length; i += 2) {
    resultArray[i] = (2 * (x[index] - minX)) / (maxX - minX) - 1;
    resultArray[i + 1] = (2 * (y[index] - 0)) / (maxY - 0) - 1;
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
        points.push(...lerp(a, b, j / step));
      }
    } else {
      points.push(a);
    }
  }

  return {
    generatedPoints: points,
    resultArray
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
  normalizeValueToRange,
  findIndexOfClosestValue,
  multiplyVector4,
  getInverse,
  identityMatrix
};
