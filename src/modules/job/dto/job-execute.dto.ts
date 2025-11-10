export type JobExecuteDto = {
  regionCode: string;
  maxResults: number;
  autoCreateCampaign: boolean;
  sendToTelegram: boolean;
  language: string;
};
