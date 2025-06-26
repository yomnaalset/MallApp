import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Reply, Heart } from 'lucide-react';
import CommentForm from './CommentForm';
import { useAuth } from '@/providers/auth-provider';
import { formatDistanceToNow } from 'date-fns'; // For relative time
import { toast } from 'react-toastify';
import {
    updateProductComment,
    deleteProductComment,
    createProductComment,
    likeComment,
    unlikeComment
} from '@/services/product.service';

const CommentItem = ({ comment, productId, onCommentUpdated, onCommentDeleted, onReplyAdded, onInteraction }) => {
    const { isAuthenticated, name: currentUsername } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Debugging Logs --- 
    console.log(`Comment ID: ${comment.id}, Comment User: '${comment.user}', Current User: '${currentUsername}', IsAuthenticated: ${isAuthenticated}`);
    const isOwner = isAuthenticated && comment.user === currentUsername;
    console.log(`Calculated isOwner for comment ${comment.id}: ${isOwner}`);
    // --- End Debugging Logs ---

    const handleEdit = async (newText) => {
        if (!isOwner || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await updateProductComment(productId, comment.id, newText);
            if (response.data.status === 'success') {
                onCommentUpdated(response.data.comment); // Pass updated comment up
                setIsEditing(false);
                toast.success("Comment updated!");
            } else {
                toast.error(response.data.message || "Failed to update comment.");
            }
        } catch (error) {
            console.error("Error updating comment:", error);
            toast.error(error.response?.data?.message || "Error updating comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!isOwner || isSubmitting) return;
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        setIsSubmitting(true);
        try {
            await deleteProductComment(productId, comment.id);
            onCommentDeleted(comment.id, comment.parent); // Pass id and parentId up
            toast.success("Comment deleted!");
            // No need to setIsSubmitting(false) as the component might unmount
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error(error.response?.data?.message || "Error deleting comment.");
            setIsSubmitting(false);
        }
    };

    const handleReply = async (replyText) => {
        if (!isAuthenticated || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await createProductComment(productId, replyText, comment.id);
            if (response.data.status === 'success') {
                onReplyAdded(response.data.comment); // Pass new reply up
                setIsReplying(false);
                toast.success("Reply posted!");
            } else {
                toast.error(response.data.message || "Failed to post reply.");
            }
        } catch (error) {
            console.error("Error posting reply:", error);
            toast.error(error.response?.data?.message || "Error posting reply.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeToggle = async () => {
        if (!isAuthenticated || isSubmitting) {
            toast.info('Please log in to like comments.');
            return;
        }
        setIsSubmitting(true);
        let success = false;
        try {
            if (comment.user_liked) {
                await unlikeComment(productId, comment.id);
            } else {
                await likeComment(productId, comment.id);
            }
            success = true;
            // Call the callback to trigger refetch in parent
            if (onInteraction) {
                onInteraction();
            }
        } catch (error) {
            console.error("Error liking/unliking comment:", error);
            const action = comment.user_liked ? 'unlike' : 'like';
            toast.error(error.response?.data?.message || `Failed to ${action} comment.`);
        } finally {
            // Only set submitting false *after* potential refetch might have started
            // or immediately if there was an error
            if (!success) {
                setIsSubmitting(false);
            }
            // Note: If refetch is very fast, setting this false might still cause flicker.
            // Consider more advanced state management if this becomes an issue.
             else { 
                 // Optionally delay setting false slightly to allow refetch to complete
                 setTimeout(() => setIsSubmitting(false), 100); 
             }
        }
    };

    const createdAt = new Date(comment.created_at);
    const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

    return (
        <div className="p-3 border-b last:border-b-0">
            <div className="flex justify-between items-start mb-1">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{comment.user}</span>
                    <span className="text-xs text-muted-foreground" title={createdAt.toLocaleString()}>
                        {timeAgo}
                        {comment.updated_at !== comment.created_at && ' (edited)'}
                    </span>
                </div>
                {isAuthenticated && (
                    <div className="flex space-x-1 items-center">
                        {isOwner && (
                            <>
                                <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(!isEditing)} disabled={isSubmitting} aria-label="Edit comment">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isSubmitting} aria-label="Delete comment">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => setIsReplying(!isReplying)} disabled={isSubmitting} aria-label="Reply to comment">
                            <Reply className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <CommentForm
                    onSubmit={handleEdit}
                    initialText={comment.text}
                    submitLabel="Update"
                    onCancel={() => setIsEditing(false)}
                    isSubmitting={isSubmitting}
                />
            ) : (
                <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap my-2">{comment.text}</p>
            )}

            <div className="flex items-center space-x-2 mt-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleLikeToggle}
                    disabled={!isAuthenticated || isSubmitting}
                    aria-label={comment.user_liked ? 'Unlike comment' : 'Like comment'}
                    className={`p-1 h-auto ${comment.user_liked ? 'text-red-500' : 'text-gray-500'}`}
                >
                    <Heart className={`h-4 w-4 ${comment.user_liked ? 'fill-current' : ''}`} />
                </Button>
                <span className="text-xs text-muted-foreground">{comment.likes_count || 0}</span>
            </div>

            {isReplying && (
                <div className="ml-4 mt-2">
                    <CommentForm
                        onSubmit={handleReply}
                        placeholder={`Replying to ${comment.user}...`}
                        submitLabel="Reply"
                        onCancel={() => setIsReplying(false)}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}

            {/* Render Replies Recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 mt-3 pl-4 border-l">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            productId={productId}
                            onCommentUpdated={onCommentUpdated}
                            onCommentDeleted={onCommentDeleted}
                            onReplyAdded={onReplyAdded}
                            onInteraction={onInteraction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem; 