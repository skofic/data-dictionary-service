'use strict';

//
// Import frameworks.
//
const fs = require('fs');								// File system utilities.
const httpError = require('http-errors');				// HTTP errors.
const status = require('statuses');						// Don't know what it is.

//
// Errors.
//
const HTTP_NOT_FOUND = status('not found');

//
// Application.
//
const K = require( '../utils/constants' );

/**
 * JSONL file reader class
 *
 * This class implements a file reader that expects JSONL contents.
 *
 * You instantiate the class by providing a file path, the file path MUST be
 * valid, or the constructor will raise an exception.
 */
class JsonLReader
{
    /**
     * Constructor
     *
     * The constructor expects a file path and the number of lines to read.
     *
     * @param theFile	{String}	The file path.
     * @throws 404
     */
    constructor( theFile )
    {
        //
        // Check file path.
        //
        if( ! fs.isFile( theFile ) ) {
            const message = "The file [" + theFile + "] does not exist.";
            throw httpError( HTTP_NOT_FOUND, message );							// !@! ==>
        }

        //
        // Create buffer.
        //
        this.buffer = fs.readBuffer( theFile );

        //
        // Initialise counters.
        //
        this.offset = 0;
        this.page = K.environment.page;
    }

    /**
     * Read lines by size
     *
     * This method will read the file line by line returning at least one line,
     * or the number of lines that fit in the provided parameter.
     *
     * It will read a buffer of the provided size, split it into lines and,
     * if there are at least two lines, it will return all, except the last.
     * If there are less than two lines, it will add the current page size
     * to the provided size until at least two lines are read, or until it reaches
     * the end of the file.
     *
     * When the method returns null, it means that it has returned all the file lines,
     * in that case it will reset the iterator and can be called again starting from
     * the beginning of the file.
     *
     * This method can be useful if you want to use a constant memory size, since
     * it will either use the provided size, or the size of the largest line.
     *
     * The method returns an array of lines, or null, when it reaches the end of
     * the file.
     *
     * @param theSize
     * @returns {*}
     */
    readLinesBySize( theSize = K.environment.buffer )
    {
        //
        // Handle beyond buffer.
        //
        if( this.offset >= this.buffer.length ) {
            this.offset = 0;
            return null;															// ==>
        }

        //
        // Split lines.
        //
        const end = this.offset + theSize;
        let lines =
            this.buffer.slice( this.offset, end )
                .toString()
                .split( /(?:\r\n|\r|\n)/g );

        //
        // Handle end of buffer.
        //
        if( end >= this.buffer.length ) {
            this.offset = end;
            return lines;															// ==>
        }

        //
        // Handle got enough lines.
        //
        if( lines.length >= 2 ) {
            this.offset = end - lines.pop().length;
            return lines;															// ==>
        }

        //
        // Get more lines.
        //
        return this.readLinesBySize( theSize + this.page );							// ==>
    }

    /**
     * Read lines by count
     *
     * This method can be used to read the file line by line, it will split the file
     * in lines and will stop when either the end of the file was reached, or the
     * number of lines matches or exceeds the provided parameter.  This means that it
     * may return more lines than required, if more lines fit in the page size,
     * or less lines when reading the last file chunk.
     *
     * When the method returns null, it means that it has returned all the file lines,
     * in that case it will reset the iterator and can be called again starting from
     * the beginning of the file.
     *
     * This method can be useful if you want to return a more or less constant number
     * of elements.
     *
     * The last parameter of the method is private and it is used in recursion.
     *
     * The method returns an array of lines, or null, when it reaches the end of
     * the file.
     *
     * @param theLines	{Number}	The minimum number of lines to read.
     * @param thePages	{Number}	(private)
     * @returns {array}|null		An array of lines, or null when done.
     */
    readLinesByCount( theLines = 100, thePages = 1 )
    {
        //
        // Handle beyond buffer.
        //
        if( this.offset >= this.buffer.length ) {
            this.offset = 0;
            return null;															// ==>
        }

        //
        // Split lines.
        //
        const end = this.offset + (this.page * thePages);
        let lines =
            this.buffer.slice( this.offset, end )
                .toString()
                .split( /(?:\r\n|\r|\n)/g );

        //
        // Handle end of buffer.
        //
        if( end >= this.buffer.length ) {
            this.offset = end;
            return lines;															// ==>
        }

        //
        // Handle got enough lines.
        //
        if( lines.length >= (theLines + 1) ) {
            this.offset = end - lines.pop().length;
            return lines;															// ==>
        }

        //
        // Get more lines.
        //
        return this.readLinesByCount( theLines, thePages + 1 );						// ==>
    }
}

module.exports = JsonLReader;
