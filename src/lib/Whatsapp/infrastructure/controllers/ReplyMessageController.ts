import type { Context, TypedResponse } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import * as HttpStatusCodes from "@/lib/Shared/common/HttpStatusCodes";
import * as HttpStatusPhrases from "@/lib/Shared/common/HttpStatusPhrases";
import type {
  Controller,
  ControllerResponse,
} from "@/lib/Shared/infrastructure/controllers/Controller";
import type { ServicesContainer } from "@/lib/Shared/infrastructure/services/createServicesContainer";
import { EmptyMessageContentError } from "@/lib/Whatsapp/domain/exceptions/EmptyMessageContentError";
import { InvalidMessageDataError } from "@/lib/Whatsapp/domain/exceptions/InvalidMessageDataError";
import { InvalidPhoneNumberError } from "@/lib/Whatsapp/domain/exceptions/InvalidPhoneNumberError";
import { RecipientNotFoundError } from "@/lib/Whatsapp/domain/exceptions/RecipientNotFoundError";

export class ReplyMessageController implements Controller {
  async run(
    c: Context,
  ): Promise<Response & TypedResponse<ControllerResponse, StatusCode, "json">> {
    try {
      const services = c.get("services") as ServicesContainer;
      const { chatId, messageId, message } = await c.req.json();

      await services.whatsapp.replyMessage.run(chatId, messageId, message);

      return c.json(
        {
          status: HttpStatusPhrases.OK,
          message: "Message replied successfully",
          data: {
            chatId,
            messageId,
            message,
          },
        },
        HttpStatusCodes.OK,
      );
    } catch (error) {
      if (
        error instanceof InvalidPhoneNumberError ||
        error instanceof InvalidMessageDataError ||
        error instanceof EmptyMessageContentError
      ) {
        return c.json(
          { status: HttpStatusPhrases.BAD_REQUEST, message: error.message },
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      if (error instanceof RecipientNotFoundError) {
        return c.json(
          { status: HttpStatusPhrases.NOT_FOUND, message: error.message },
          HttpStatusCodes.NOT_FOUND,
        );
      }

      throw error;
    }
  }
}
