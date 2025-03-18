export function getFormattedDate(): string {
    let dateString = "";
    const date: Date = new Date();
    const day = padZeroToSingleDigit(date.getDate());
    const month = padZeroToSingleDigit(date.getMonth() + 1);
    const year = date.getFullYear().toString();
    const hours = padZeroToSingleDigit(date.getHours());
    const minutes = padZeroToSingleDigit(date.getMinutes());
    const seconds = padZeroToSingleDigit(date.getSeconds());

    dateString =
      year +
      "-" +
      month +
      "-" +
      day +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds;

    return dateString;
  }

  export function padZeroToSingleDigit(value: number) {
    const retVal: string = value < 10 ? "0" + value : value.toString();
    return retVal;
  }

export function getGreetingTime() {
	const currentHour = new Date().getHours();
    let ret;
	if(currentHour >= 12 && currentHour <= 17) {
		ret = "afternoon";
	} else if(currentHour >= 17) {
		ret = "evening";
	} else {
		ret = "morning";
	}
	
	return ret;
}

