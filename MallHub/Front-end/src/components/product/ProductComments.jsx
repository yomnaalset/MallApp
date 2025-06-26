import React, { useState, useEffect, useCallback } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { Button } from '@/components/ui/button';
import {
    getProductComments,
    createProductComment
} from '@/services/product.service';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'react-toastify';

// Helper function to update nested comments/replies immutably
const updateCommentInChildren = (comments, updatedComment) => {
    return comments.map(comment => {
        if (comment.id === updatedComment.id) {
            return { ...comment, ...updatedComment }; // Update the comment itself
        }
        if (comment.replies && comment.replies.length > 0) {
            // Recursively update replies
            return { ...comment, replies: updateCommentInChildren(comment.replies, updatedComment) };
        }
        return comment;
    });
};

// Helper function to delete nested comments/replies immutably
const deleteCommentInChildren = (comments, commentIdToDelete) => {
    return comments.reduce((acc, comment) => {
        if (comment.id === commentIdToDelete) {
            return acc; // Filter out the comment to delete
        }
        if (comment.replies && comment.replies.length > 0) {
            // Recursively delete from replies
            comment.replies = deleteCommentInChildren(comment.replies, commentIdToDelete);
        }
        acc.push(comment);
        return acc;
    }, []);
};

// Helper function to add a reply immutably
const addReplyToChildren = (comments, newReply) => {
    return comments.map(comment => {
        if (comment.id === newReply.parent) {
            // Add reply to the correct parent
            return { ...comment, replies: [...(comment.replies || []), newReply] };
        }
        if (comment.replies && comment.replies.length > 0) {
            // Recursively check replies
            return { ...comment, replies: addReplyToChildren(comment.replies, newReply) };
        }
        return comment;
    });
};

const ProductComments = ({ productId }) => {
    const { isAuthenticated } = useAuth();
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 10,
        hasNext: false,
        hasPrevious: false,
    });

    const fetchComments = useCallback(async (page = 1) => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const response = await getProductComments(productId, page, pagination.perPage);
            if (response.data.status === 'success') {
                // If loading page 1, replace comments, otherwise append (or handle more complex updates)
                setComments(response.data.comments || []);
                setPagination({
                    currentPage: response.data.pagination.current_page,
                    totalPages: response.data.pagination.total_pages,
                    totalItems: response.data.pagination.total_items,
                    perPage: response.data.pagination.per_page,
                    hasNext: response.data.pagination.has_next,
                    hasPrevious: response.data.pagination.has_previous,
                });
            } else {
                toast.error("Failed to load comments.");
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            toast.error("Error loading comments.");
        } finally {
            setIsLoading(false);
        }
    }, [productId, pagination.perPage]);

    useEffect(() => {
        fetchComments(1); // Fetch initial page on mount or productId change
    }, [fetchComments]); // Rerun when fetchComments function identity changes (due to productId change)

    const handleAddComment = async (text) => {
        if (!isAuthenticated || isSubmitting) return;
        setIsSubmitting(true);
        let success = false;
        try {
            const response = await createProductComment(productId, text);
            if (response.data.status === 'success') {
                toast.success("Comment added!");
                // Refetch comments list instead of manipulating state directly
                await fetchComments(1);
                success = true;
            } else {
                toast.error(response.data.message || "Failed to add comment.");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error(error.response?.data?.message || "Error adding comment.");
        } finally {
            setIsSubmitting(false);
        }
        return success; // Return success status for form handling
    };

    // --- Handlers to update state based on child actions --- 

    const handleCommentUpdated = (updatedComment) => {
        setComments(prevComments => updateCommentInChildren(prevComments, updatedComment));
    };

    const handleCommentDeleted = (deletedCommentId, parentId) => {
        setComments(prevComments => deleteCommentInChildren(prevComments, deletedCommentId));
        // Decrement total count
        setPagination(prev => ({ ...prev, totalItems: Math.max(0, prev.totalItems - 1) }));
        // Potentially refetch if page becomes empty, etc. (more complex logic)
    };

    const handleReplyAdded = async (newReply) => {
        // No need to manually add to state, just refetch
        toast.success('Reply posted! Refetching comments...'); // Give feedback
        await fetchComments(1);
        // Note: This simplifies logic but always returns to page 1 after a reply.
        // More complex logic could try to stay on the current page if desired.
    };

    // --- New Handler for Likes/Unlikes ---
    const handleCommentInteraction = async () => {
        // Refetch the current page of comments after a like/unlike action
        console.log(`Refetching comments on page ${pagination.currentPage} after interaction.`);
        await fetchComments(pagination.currentPage);
    };
    // ------------------------------------

    const handleLoadMore = () => {
        if (pagination.hasNext && !isLoading) {
            fetchComments(pagination.currentPage + 1);
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Comments ({pagination.totalItems})</h3>

            {isAuthenticated && (
                <div className="mb-4 p-4 border rounded-lg shadow-sm bg-card">
                    <h4 className="text-md font-medium mb-2">Leave a comment</h4>
                    <CommentForm onSubmit={handleAddComment} isSubmitting={isSubmitting} />
                </div>
            )}

            {isLoading && comments.length === 0 && <p>Loading comments...</p>}
            {!isLoading && comments.length === 0 && !isAuthenticated && <p>Log in to leave a comment.</p>}
            {!isLoading && comments.length === 0 && isAuthenticated && <p>No comments yet. Be the first!</p>}

            {comments.length > 0 && (
                <div className="space-y-0 border rounded-lg overflow-hidden shadow-sm bg-card">
                    {comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            productId={productId}
                            onCommentUpdated={handleCommentUpdated}
                            onCommentDeleted={handleCommentDeleted}
                            onReplyAdded={handleReplyAdded}
                            onInteraction={handleCommentInteraction}
                        />
                    ))}
                </div>
            )}

            {/* Simple Pagination */}
            {pagination.totalPages > 1 && (
                 <div className="mt-4 flex justify-center">
                     <Button
                         onClick={() => fetchComments(pagination.currentPage - 1)}
                         disabled={!pagination.hasPrevious || isLoading}
                         variant="outline"
                     >
                         Previous
                     </Button>
                     <span className="mx-4 self-center text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
                     <Button
                         onClick={() => fetchComments(pagination.currentPage + 1)}
                         disabled={!pagination.hasNext || isLoading}
                         variant="outline"
                     >
                         Next
                     </Button>
                 </div>
             )}
        </div>
    );
};

export default ProductComments; 