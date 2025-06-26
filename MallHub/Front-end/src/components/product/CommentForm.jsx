import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const CommentForm = ({
    onSubmit,
    initialText = '',
    placeholder = "Write a comment...",
    submitLabel = "Submit",
    onCancel = null, // Optional cancel callback
    isSubmitting = false
}) => {
    const [text, setText] = useState(initialText);

    const canSubmit = text.trim().length > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit || isSubmitting) return;
        onSubmit(text);
        // Optionally clear the form after successful submission
        // if (!initialText) { // Clear only if it's a new comment form
        //     setText('');
        // }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 mt-2">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                rows={3}
                disabled={isSubmitting}
            />
            <div className="flex justify-end space-x-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={!canSubmit || isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : submitLabel}
                </Button>
            </div>
        </form>
    );
};

export default CommentForm; 