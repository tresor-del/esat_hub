import React from "react";
import { FiFileText, FiShare2 } from "react-icons/fi";
import Avatar from "../../../components/ui/Avatar";
import { formatMediaType } from "../utils/mediaHelpers";
import { Countdown } from "../utils/AsnmtCountDown";

const AssignmentCard = ({ asnmt, onOpen }) => {

    return (
        <button
            type="button"
            className="media-item"
            onClick={() => onOpen(asnmt)}
        >
            <div className="media-preview">
                <div className="media-preview-icon">
                    <FiFileText size={28} />
                </div>
            </div>

            <div className="media-item-body">
                <div className="media-item-meta">
                    <span className="media-item-badge">{asnmt.media?.length} {formatMediaType(asnmt.media)}{asnmt.media?.length > 1 ? "s" : ""} </span>
                    <span className="media-item-badge" >
                        {asnmt.due_date
                            ? <Countdown dueDate={asnmt.due_date} />
                            : ""}
                    </span>
                </div>

                <h4>{asnmt.title}</h4>
                <p>{asnmt.description || "Pas de description"}</p>

                <div className="media-item-footer">
                    <div className="media-item-author">
                        <Avatar user={asnmt.teacher} size="small" />
                        <span>
                            {asnmt.teacher?.full_name ||
                                "Anonyme"}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default AssignmentCard;
