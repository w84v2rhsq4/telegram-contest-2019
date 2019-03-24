// prettier-ignore
const months = [
  'Jan', 'Feb','Mar', 
  'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sept', 
  'Oct', 'Nov', 'Dec' 
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getEventProps(e) {
  if (e.touches && e.touches.length === 1) {
    return e.touches[0];
  } else {
    return e;
  }
}

function throttle(func, ms) {
  let isThrottled = false,
    savedArgs,
    savedThis;

  function wrapper() {

    if (isThrottled) {
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments);

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

export { months, days, throttle, getEventProps };
