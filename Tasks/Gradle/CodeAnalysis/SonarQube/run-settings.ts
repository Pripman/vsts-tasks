/// <reference path="../../../../definitions/vsts-task-lib.d.ts" />
import fs = require('fs');
import tl = require('vsts-task-lib/task');

/**
 * Data class representing the report-task.txt file contents. Should be treated as read-only.
 */
export class SonarQubeRunSettings {

    /**
     * Construct a new SonarQubeRunSettings instance.
     * @param projectKey   A string uniquely identifying the project on the SonarQube server
     * @param serverUrl    A URI for a local or remote SonarQube server
     * @param dashboardUrl A URI to the dashboard where the analysis of this project can be found
     * @param ceTaskId     A string uniquely identifying this analysis task of the project
     * @param ceTaskUrl    A string leading to the SonarQube Web API endpoint for the details of this analysis task
     */
    constructor(public projectKey: string,
                public serverUrl: string,
                public dashboardUrl: string,
                public ceTaskId: string,
                public ceTaskUrl: string) {
        if (!projectKey) {
            // Looks like: Failed to create TaskReport object. Missing field: projectKey
            throw new Error(tl.loc('sqCommon_CreateTaskReport_MissingField', 'projectKey'));
        }
        if (!serverUrl) {
            // Looks like: Failed to create TaskReport object. Missing field: serverUrl
            throw new Error(tl.loc('sqCommon_CreateTaskReport_MissingField', 'serverUrl'));
        }
        if (!dashboardUrl) {
            // Looks like: Failed to create TaskReport object. Missing field: dashboardUrl
            throw new Error(tl.loc('sqCommon_CreateTaskReport_MissingField', 'dashboardUrl'));
        }
        if (!ceTaskId) {
            // Looks like: Failed to create TaskReport object. Missing field: ceTaskId
            throw new Error(tl.loc('sqCommon_CreateTaskReport_MissingField', 'ceTaskId'));
        }
        if (!ceTaskUrl) {
            // Looks like: Failed to create TaskReport object. Missing field: ceTaskUrl
            throw new Error(tl.loc('sqCommon_CreateTaskReport_MissingField', 'ceTaskUrl'));
        }
    }

    /**
     * Create a new SonarQubeRunSettings instance from a report-task.txt file that exists on disk.
     * @param filePath Path to a report-task.txt file generated by a SonarQube build plugin
     * @returns {SonarQubeRunSettings} A new SonarQubeRunSettings with appropriate fields filled
     */
    public static createRunSettingsFromFile(filePath: string): SonarQubeRunSettings {
        if (!SonarQubeRunSettings.fsExistsSync(filePath)) {
            tl.debug('Task report not found at: ' + filePath);
            // Looks like: Invalid or missing task report. Check SonarQube finished successfully.
            throw new Error(tl.loc('sqAnalysis_TaskReportInvalid'));
        }

        let runSettingsFileString: string = fs.readFileSync(filePath, 'utf-8');
        if (!runSettingsFileString || runSettingsFileString.length < 1) {
            tl.debug('Error reading file:' + runSettingsFileString);
            // Looks like: Invalid or missing task report. Check SonarQube finished successfully.
            throw new Error(tl.loc('sqAnalysis_TaskReportInvalid'));
        }

        let runSettingsMap: Map<string, string> = SonarQubeRunSettings.createRunSettingsMapFromString(runSettingsFileString);
        try {
            return new SonarQubeRunSettings(runSettingsMap.get('projectKey'),
                                            runSettingsMap.get('serverUrl'),
                                            runSettingsMap.get('dashboardUrl'),
                                            runSettingsMap.get('ceTaskId'),
                                            runSettingsMap.get('ceTaskUrl')
            );
        } catch (err) {
            tl.debug(err.message);
            // Looks like: Invalid or missing task report. Check SonarQube finished successfully.
            throw new Error(tl.loc('sqAnalysis_TaskReportInvalid'));
        }
    }

    /**
     * Transforms a string read of report-task.txt into a key-value map of the run settings.
     * @param runSettingsString The contents of report-task.txt as a string
     */
    private static createRunSettingsMapFromString(runSettingsString: string): Map<string, string> {
        let lines: string[] = runSettingsString.replace(/\r\n/g, '\n').split('\n'); // proofs against xplat line-ending issues

        let runSettingsMap: Map<string, string> = new Map<string, string>();
        lines.forEach((line: string) => {
            let splitLine: string[] = line.split('=');
            if (splitLine.length > 1) {
                runSettingsMap.set(splitLine[0], splitLine.slice(1, splitLine.length).join());
            }
        });

        return runSettingsMap;
    }

    private static fsExistsSync(filePath: string): boolean {
        try {
            fs.accessSync(filePath);
            return true;
        } catch (err) {
            return false;
        }
    }
}