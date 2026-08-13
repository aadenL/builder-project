"use client";

// Cal is the react component that displays the embedded calendar
// getCalApi is a function for configuring the calendar's interface and behaviour
import Cal, { getCalApi } from "@calcom/embed-react";
// useEffect means run browser side code after the component has been added to the page
import { useEffect } from "react";

type CalBookingProps = {
  listingId: string;
  listingName: string;
  listingAddress: string;
};

// create and exports the component, the 3 props are extracted from the props object through destructuring
export default function CalBooking({
  listingId,
  listingName,
  listingAddress,
}: CalBookingProps) {
  // run this effect after the component is mounted to the browser (after the calendar popup is loaded)
  useEffect(() => {
    // a function to configure the calendar
    async function configureCalendar() {
      // retrieve the Cal.com embed API for a specific namespace
      const cal = await getCalApi({
        namespace: "pre-construction-consultation",
      });

      // configure the UI of the embedded calendar
      cal("ui", {
        // display the event info
        hideEventTypeDetails: false,
        // initially display the monthly calendar layout
        layout: "month_view",
      });
    }

    // call the async function
    // void intentionally ignores the returned Promise, meaning that the effect does not need to wait for
    // or return its result
    void configureCalendar();

    // an empty dependancy array meaning that the effect runs once when this component is fully loaded
  }, []);

  return (
    <div className="h-[560px] w-full max-w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm sm:h-[620px] sm:rounded-2xl">
      <Cal
        namespace="pre-construction-consultation"
        calLink="aadenl/pre-construction-consultation"
        config={{
          layout: "month_view",

          // Must match the booking-question identifier in Cal.com.
          Property: `${listingName} — ${listingAddress}`,

          // Stored internally with the Cal.com booking.
          "metadata[listingId]": listingId,
        }}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "100%",
        }}
      />
    </div>
  );
}
