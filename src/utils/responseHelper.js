export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = {
        success: true,
        message,
    };

    // Chỉ đính kèm data nếu có
    if (data !== null && data !== undefined) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};


export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null && errors !== undefined) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};
