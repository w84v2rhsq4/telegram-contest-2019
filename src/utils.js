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
export { months, days, getEventProps };
