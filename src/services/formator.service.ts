class FormatorService {
    constructor() { }
  
    /**
     * A function that mask the card number with masking character
     * example
     * unMaskedField = 1234567890123456  return value = 123456XXXX123456
     *
     * @param unMaskedField The card number to which not mask
     * @param maskingCharacter The special masking character, default value is 'X'
     * @returns the masking card number with masking character
     */
    maskCardNumber(unMaskedField: string, maskingCharacter?: string) {
      let retVal = unMaskedField;
      if (maskingCharacter === undefined || maskingCharacter === null) {
        maskingCharacter = "X";
      }
      if (unMaskedField.length >= 12) {
        const substring1 = unMaskedField.substring(0, 6);
        const substring2 = unMaskedField.substring(6, 12);
        const middlePart = substring2.replace(/./g, maskingCharacter);
        const substring3 = unMaskedField.substring(12, unMaskedField.length);
        retVal = substring1 + middlePart + substring3;
      }
  
      return retVal;
    }
  
    /**
     * A function that take a number as a string and format it with dot
     * example
     * amountAsString = 98765432.02  return value = 98765432.02
     *
     * @param amountAsString The number to which commas should be added
     * @returns the given amount with dot.
     */
    numberWithFractionDigits(amountAsString: string): string {
      let amountFormatted = "";
      if (!isNaN(Number(amountAsString))) {
        const numberVal = Number(amountAsString).toFixed(2);
        amountFormatted = numberVal.toString();
      } else {
        amountFormatted = amountAsString;
      }
      return amountFormatted;
    }
  
    /**
     * A function that take a number as a string and format it with commas and dots
     * example
     * amountAsString = 98765432.02  return value = 98,765,432.02
     *
     * @param amountAsString The number to which commas should be added
     * @param minimumNumberOfFractionDigits The minimum number of digits to be added after decimal
     * @param maximumNumberOfFractionDigits The maximum number of digits to be added after decimal
     * @returns the given amount with commas.
     */
    numberWithCommas(
      amountAsString: string,
      minimumNumberOfFractionDigits = 2,
      maximumNumberOfFractionDigits = 2
    ): string {
      let amountFormatted = "";
      if (!isNaN(Number(amountAsString))) {
        const numberVal = Number(amountAsString).toFixed(2);
        const options = {
          minimumFractionDigits: minimumNumberOfFractionDigits,
          maximumFractionDigits: maximumNumberOfFractionDigits,
        };
        amountFormatted = Number(numberVal).toLocaleString("en", options);
      } else {
        amountFormatted = amountAsString;
      }
      return amountFormatted;
    }
  
    /**
     * A function that add one space in every 4 digits
     * example
     * accountNumber = 1234567890  return value = 1234 5678 90
     *
     * @returns There is one space in every 4 digits
     */
    accountSpaceFormat(accountNumber: string): string {
      let result = "";
      if (accountNumber != null && accountNumber !== undefined) {
        result = accountNumber.replace(/\s/g, "").replace(/(.{4})/g, "$1 ");
      }
      return result;
    }
  
    percentageFormatter(num: number, minimumFractionDigits: number, maximumFractionDigits: number) {
      return new Intl.NumberFormat("default", {
        style: "percent",
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits,
      }).format(num);
    }
  }
  
  const myFormatorService = new FormatorService();
  
  export { myFormatorService };
  