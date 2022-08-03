import { ReportHandler } from "web-vitals";

export const reportWebVitals = (onPerfEntry?: ReportHandler) => {
    if (!(onPerfEntry && onPerfEntry instanceof Function)) {
        return;
    }
    (async () => {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import(
            "web-vitals"
        );
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
    })();
};
