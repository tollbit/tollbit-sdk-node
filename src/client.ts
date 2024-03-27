import axios from "axios";
import { decrypt, encrypt } from "./crypto";

interface Client {
  generateToken(params: TokenParams): string;
  getContentWithToken(token: string): Promise<ContentResponse>;
  getContent(params: TokenParams): Promise<ContentResponse>;
  getRate(targetUrl: string): Promise<RateResponse>;
}

export type TollbitParams = {};

export type TokenParams = {
  url: string;
  maxPriceMicros: number;
  currency: string; // only supports USD for now
};

type TokenStruct = {
  orgCuid: string;
  key: string;
  url: string;
  userAgent: string;
  maxPriceMicros: number;
  currency: string;
};

type ContentResponse = {
  content: string;
  rate: RateResponse;
};

type RateResponse = {
  priceMicros: number;
  currency: string;
  error: string;
};

export class Tollbit implements Client {
  private secretKey: string;
  private userAgent: string;
  private organizationId: string;

  constructor(secretKey: string, userAgent: string, organizationId: string) {
    this.secretKey = secretKey;
    this.userAgent = userAgent;
    this.organizationId = organizationId;
  }

  public generateToken(params: TokenParams): string {
    const token: TokenStruct = {
      orgCuid: this.organizationId,
      key: this.secretKey,
      url: params.url,
      userAgent: this.userAgent,
      maxPriceMicros: params.maxPriceMicros,
      currency: params.currency,
    };

    const tokenString = JSON.stringify(token);

    const encryptedToken = encrypt(tokenString, this.secretKey);

    return encryptedToken;
  }

  /**
   * getContentWithToken
   */
  public async getContentWithToken(token: string): Promise<ContentResponse> {
    const decryptedToken = decrypt(token, this.secretKey);
    const t: TokenStruct = JSON.parse(decryptedToken);

    let tollbitUrl = t.url.replace(/^https?:\/\//, "");
    tollbitUrl = tollbitUrl.replace(/^www\./, "");
    tollbitUrl = `https://api.tollbit.com/dev/v1/content/${tollbitUrl}`;

    const headers = {
      TollbitOrgCuid: t.orgCuid,
      "User-Agent": `Mozilla/5.0 (compatible; ${this.userAgent}; +https://tollbit.com/bot)`,
      TollbitToken: token,
    };

    const response = await axios.get(tollbitUrl, { headers });

    const contentResponse: ContentResponse[] = response.data;
    if (contentResponse.length === 0 || contentResponse[0].content === "") {
      throw new Error("Could not get content");
    }

    return contentResponse[0];
  }

  public async getContent(params: TokenParams): Promise<ContentResponse> {
    const token = this.generateToken(params);

    const contentResponse = this.getContentWithToken(token);

    return contentResponse;
  }

  public async getRate(targetUrl: string): Promise<RateResponse> {
    let tollbitUrl = targetUrl.replace(/^https?:\/\//, "");
    tollbitUrl = tollbitUrl.replace(/^www\./, "");
    tollbitUrl = `https://api.tollbit.com/dev/v1/rate/${tollbitUrl}`;

    const headers = {
      "User-Agent": `Mozilla/5.0 (compatible; ${this.userAgent}; +https://tollbit.com/bot)`,
    };

    const response = await axios.get(tollbitUrl, { headers });

    const rateResponse: RateResponse[] = response.data;
    if (rateResponse.length === 0) {
      throw new Error("Could not get rate");
    }

    return rateResponse[0];
  }
}
